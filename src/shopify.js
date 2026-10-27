import { createHmac, timingSafeEqual } from 'node:crypto';
import { campaignWindow, SIZES } from './core.js';

const CART_MUTATION=`mutation MissionFlagCartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { id checkoutUrl }
    userErrors { field message }
  }
}`;
const isStr=(value)=>typeof value==='string' && value.length>0;
const safeToken=(value)=>typeof value==='string' && /^[A-Za-z0-9_-]{0,120}$/.test(value);
const attr=(key,value)=>({key,value:String(value)});
const signature=(value,secret)=>createHmac('sha256',secret).update(value).digest('hex');
const signedMessage=(data)=>JSON.stringify([
  data.campaignId,data.proofId,data.sizeId,data.participantToken,
  data.variantId,data.quantity,data.closesAt
]);

/** Verify Shopify's HMAC over the exact raw HTTP bytes, before JSON parsing. */
export function verifyShopifyWebhook({rawBody,hmacHeader,secret}) {
  if(!secret||(!Buffer.isBuffer(rawBody)&&typeof rawBody!=='string')
    ||typeof hmacHeader!=='string') return false;
  const calculated=createHmac('sha256',secret).update(rawBody).digest();
  if(!/^[A-Za-z0-9+/]{43}=$/.test(hmacHeader)) return false;
  const supplied=Buffer.from(hmacHeader,'base64');
  return calculated.length===supplied.length && timingSafeEqual(calculated,supplied);
}

/** Server-generated, integrity-protected line attribution. Never trust editable cart notes alone. */
export function signedLineAttributes(data,secret) {
  if(!isStr(secret)||!isStr(data?.campaignId)||!isStr(data?.proofId)||
    !isStr(data?.sizeId)||!safeToken(data?.participantToken)||
    !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(data?.variantId)||
    !Number.isSafeInteger(data?.quantity)||data.quantity<1||data.quantity>100||
    !Number.isSafeInteger(data?.closesAt)||data.closesAt<=0)
    throw new Error('Invalid cart attribution fields');
  const token=signature(signedMessage(data),secret);
  return [
    attr('_mf_campaign',data.campaignId),
    attr('_mf_proof',data.proofId),
    attr('_mf_size',data.sizeId),
    attr('_mf_participant',data.participantToken),
    attr('_mf_variant',data.variantId),
    attr('_mf_qty',data.quantity),
    attr('_mf_closes_at',data.closesAt),
    attr('_mf_signature',token)
  ];
}

/** Recheck signatures and paid time at ingestion, then compare to server-side saved campaign/proof/variant. */
export function verifyLineAttribution(attributes,secret,{orderCreatedAt}={}) {
  if(!Array.isArray(attributes)||!isStr(secret)) return null;
  const values=new Map();
  for(const item of attributes) {
    const key=item?.key||item?.name;
    const value=item?.value;
    if(typeof key!=='string'||typeof value!=='string'||values.has(key)) return null;
    values.set(key,value);
  }
  const data={
    campaignId:values.get('_mf_campaign'),
    proofId:values.get('_mf_proof'),
    sizeId:values.get('_mf_size'),
    participantToken:values.get('_mf_participant'),
    variantId:values.get('_mf_variant'),
    quantity:Number(values.get('_mf_qty')),
    closesAt:Number(values.get('_mf_closes_at'))
  };
  try {
    const expected=signedLineAttributes(data,secret).at(-1).value;
    const got=values.get('_mf_signature');
    if(!/^[a-f0-9]{64}$/.test(got||'')) return null;
    if(!timingSafeEqual(Buffer.from(got,'hex'),Buffer.from(expected,'hex'))) return null;
    const purchaseTime=Date.parse(orderCreatedAt);
    // Ingestion can occur after close; the actual paid order timestamp is decisive.
    if(!Number.isFinite(purchaseTime)||purchaseTime>=data.closesAt) return null;
    return Object.freeze(data);
  } catch { return null; }
}

function validShop(shop) {
  return typeof shop==='string' && /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop);
}

/**
 * Guest checkout adapter. Inputs campaign, proof and variantMapping MUST come from trusted
 * server-side records, not supporter-controlled request objects.
 */
export async function createFundraiserCheckout({
  shopDomain,storefrontToken,apiVersion='2026-07',campaign,proof,
  variantMapping,sizeId,quantity=1,participantToken='',signingSecret,
  now=Date.now(),fetchImpl=globalThis.fetch
}) {
  if(!validShop(shopDomain)||!isStr(storefrontToken)||
    !/^20\d{2}-(01|04|07|10)$/.test(apiVersion)) throw new Error('Invalid Shopify configuration');
  if(!campaign||campaign.status!=='published'||!proof||
    proof.status!=='approved'||proof.campaignId!==campaign.id||
    !campaign.artworkAuthorized||!campaign.pricesVerified)
    throw new Error('Campaign or artwork is not approved for sale');
  const window=campaignWindow({startsAt:campaign.startsAt,durationDays:campaign.durationDays,now});
  if(window.status!=='active') throw new Error('Fundraiser is not accepting orders');
  if(!SIZES.some(size=>size.initial&&size.id===sizeId))
    throw new Error('Unsupported MVP flag size');
  const variant=variantMapping?.[sizeId];
  if(!variant?.validated||!variant?.enabled||!variant?.shopifyVariantId)
    throw new Error('Flag size not validated for purchase');
  const data={
    campaignId:campaign.id,proofId:proof.id,sizeId,participantToken,
    variantId:variant.shopifyVariantId,quantity,closesAt:Date.parse(window.endsAt)
  };
  const variables={input:{lines:[{
    merchandiseId:variant.shopifyVariantId,quantity,
    attributes:signedLineAttributes(data,signingSecret)
  }]}};
  const endpoint=`https://${shopDomain}/api/${apiVersion}/graphql.json`;
  const res=await fetchImpl(endpoint,{method:'POST',headers:{
    'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':storefrontToken
  },body:JSON.stringify({query:CART_MUTATION,variables})});
  if(!res.ok) throw new Error('Shopify cart creation failed');
  const response=await res.json();
  if(response.errors?.length||response.data?.cartCreate?.userErrors?.length)
    throw new Error('Shopify rejected cart creation');
  const checkoutUrl=response.data?.cartCreate?.cart?.checkoutUrl;
  if(typeof checkoutUrl!=='string'||!/^https:\/\//.test(checkoutUrl))
    throw new Error('Shopify did not return a secure checkout link');
  return {checkoutUrl,cartId:response.data.cartCreate.cart.id};
}
