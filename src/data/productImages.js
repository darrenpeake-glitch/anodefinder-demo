import mercuryAlphaOneGen2 from '../product-images/mercury-alpha-one-gen2-test.svg'

const imageBySku = new Map([
  ['KITALPHAONE', mercuryAlphaOneGen2],
])

export function productImage(product) {
  return product ? imageBySku.get(product.sku) || null : null
}

export const DEMO_IMAGE_NOTE = 'Catalogue image shown for demonstration. Replace with supplier-approved production imagery before launch.'
