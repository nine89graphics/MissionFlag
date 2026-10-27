import {createFundraiserCheckout} from './shopify.js';
import {SIZES} from './core.js';

/**
 * Guest checkout orchestration. No public request may provide pricing, Shopify
 * variant IDs, proof status, campaign IDs or store credentials. Fetch them here.
 */
export async function beginSupporterCheckout({
  slug,sizeId,quantity=1,participantToken='',repository,
  shopifyConfig,now=Date.now(),createCart=createFundraiserCheckout
}) {
  if(typeof slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||
    slug.length>100)
    throw new Error('Invalid fundraiser link');
  if(!SIZES.some(size=>size.initial&&size.id===sizeId))
    throw new Error('Flag size unavailable');
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100)
    throw new Error('Invalid flag quantity');
  if(typeof participantToken!=='string'||!/^[A-Za-z0-9_-]{0,120}$/.test(participantToken))
    throw new Error('Invalid participant link');
  if(!repository||!shopifyConfig)throw new Error('Checkout is not configured');
  const campaign=await repository.findPublishedCampaign(slug);
  if(!campaign||campaign.slug!==slug||campaign.status!=='published')
    throw new Error('This fundraiser is not available');
  const proof=await repository.findApprovedPrintProof(campaign.id);
  if(!proof||proof.status!=='approved'||!proof.printAssetKey)
    throw new Error('Approved production artwork is not available');
  const variant=await repository.findPublishedSize(campaign.id,proof.id,sizeId);
  if(!variant?.enabled||!variant?.validated||!variant.shopifyVariantId)
    throw new Error('Flag size is not ready for checkout');
  if(participantToken&&!(await repository.validateAdultParticipant(campaign.id,participantToken)))
    throw new Error('Participant link is not valid');
  const variantMapping={[sizeId]:variant};
  return createCart({...shopifyConfig,campaign,proof,variantMapping,
    sizeId,quantity,participantToken,now});
}
