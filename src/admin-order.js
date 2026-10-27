/**
 * Shopify Admin Order adapter. Fetch only in trusted server context with read_orders.
 * Financial ledger uses original merchandise less ALL allocated discounts, not the
 * LineItem.discountedTotalSet (which can exclude order-level discounts).
 */
const ORDER_QUERY=[
'query MissionFlagPaidOrder($id: ID!) {',
'  order(id: $id) { id createdAt displayFinancialStatus',
'    lineItems(first: 250) { pageInfo { hasNextPage } edges { node {',
'      id quantity variant { id } customAttributes { key value }',
'      originalTotalSet { shopMoney { amount currencyCode } }',
'      discountAllocations { allocatedAmountSet { shopMoney { amount currencyCode } } }',
'    } } }',
'  }',
'}'
].join('\n');

export function parseUsdCents(money) {
  if(money?.currencyCode!=='USD'||typeof money.amount!=='string'||
    !/^(0|[1-9]\d{0,10})(?:\.\d{1,2})?$/.test(money.amount))
    throw new Error('Expected exact USD amount with at most two decimals');
  const [d,c='']=money.amount.split('.');
  const cents=Number(d)*100+Number(c.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents))throw new Error('Amount exceeds safe integer');
  return cents;
}

export function normalizeShopifyAdminOrder(order) {
  if(!order?.id||!order.lineItems?.edges||order.lineItems.pageInfo?.hasNextPage)
    throw new Error('Incomplete Shopify Admin order: all lines must be fetched');
  if(!Number.isFinite(Date.parse(order.createdAt)))
    throw new Error('Missing Shopify order timestamp');
  const lineItems=order.lineItems.edges.map(({node})=>{
    if(!node?.id||!node?.variant?.id||!Number.isSafeInteger(node.quantity)||
      node.quantity<1||!Array.isArray(node.customAttributes)||
      !Array.isArray(node.discountAllocations)) throw new Error('Incomplete Shopify order line');
    const original=parseUsdCents(node.originalTotalSet?.shopMoney);
    const discount=node.discountAllocations.reduce((n,item)=>
      n+parseUsdCents(item.allocatedAmountSet?.shopMoney),0);
    const discountedTotalCents=original-discount;
    if(discountedTotalCents<0)throw new Error('Discount exceeds merchandise value');
    return {id:node.id,variantId:node.variant.id,quantity:node.quantity,
      customAttributes:node.customAttributes,discountedTotalCents};
  });
  return {id:order.id,createdAt:order.createdAt,
    displayFinancialStatus:order.displayFinancialStatus,lineItems};
}

export function createShopifyAdminOrderFetcher({
  shopDomain,accessToken,apiVersion='2026-10',fetchImpl=globalThis.fetch
}) {
  if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shopDomain||'')||
     typeof accessToken!=='string'||!accessToken||
     !/^20\d{2}-(01|04|07|10)$/.test(apiVersion))
    throw new Error('Invalid Shopify Admin configuration');
  return async function fetchShopifyOrder(orderId,requestedShop) {
    if(requestedShop!==shopDomain||!/^gid:\/\/shopify\/Order\/\d+$/.test(orderId))
      throw new Error('Order/shop identity does not match configured Shopify store');
    const response=await fetchImpl(
      'https://'+shopDomain+'/admin/api/'+apiVersion+'/graphql.json',{
        method:'POST',headers:{'Content-Type':'application/json',
          'X-Shopify-Access-Token':accessToken},
        body:JSON.stringify({query:ORDER_QUERY,variables:{id:orderId}})
      });
    if(!response.ok)throw new Error('Shopify Admin order lookup failed');
    const payload=await response.json();
    if(payload.errors?.length||!payload.data?.order)
      throw new Error('Shopify Admin returned an invalid order response');
    const normalized=normalizeShopifyAdminOrder(payload.data.order);
    if(normalized.id!==orderId)throw new Error('Order ID mismatch');
    return normalized;
  };
}
