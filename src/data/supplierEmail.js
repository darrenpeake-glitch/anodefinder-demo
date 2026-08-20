export const TECNOSEAL_ORDER_EMAIL = 'sales@tecnoseal.co.uk'

export function buildSupplierEmail(supplierOrder) {
  const lineText = supplierOrder.lines
    .map((line) => `${line.qty} × Tecnoseal ${line.sku}`)
    .join('\n')

  const shipTo = supplierOrder.shipTo
  const subject = `Purchase Order ${supplierOrder.poNumber} – Direct Delivery`
  const body = [
    'Hello Tecnoseal UK,',
    '',
    `Please supply the following against purchase order ${supplierOrder.poNumber}.`,
    `Our customer order reference is ${supplierOrder.customerOrderNo}.`,
    '',
    lineText,
    '',
    'Please deliver direct to:',
    shipTo.name,
    shipTo.address,
    shipTo.town,
    shipTo.postcode,
    '',
    'Please do not include our trade pricing or trade invoice in the parcel.',
    'Please confirm order acceptance and advise expected dispatch. Please send tracking details when available.',
    '',
    'Kind regards,',
    'AnodeFinder',
  ].join('\n')

  return {
    to: TECNOSEAL_ORDER_EMAIL,
    subject,
    body,
    channel: 'EMAIL',
    status: 'PO_EMAIL_READY',
  }
}
