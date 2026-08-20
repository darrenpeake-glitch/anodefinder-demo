import mercuryAlphaOneGen2 from '../product-images/mercury-alpha-one-gen2.svg'
import sleipner01050 from '../product-images/sleipner-01050.svg'
import volvoDphDprKit from '../product-images/volvo-dph-dpr-kit.svg'

const imageBySku = new Map([
  ['KITALPHAONE', mercuryAlphaOneGen2],
  ['KITALPHAONE/AL', mercuryAlphaOneGen2],
  ['KITALPHAONE-MG', mercuryAlphaOneGen2],
  ['01050', sleipner01050],
  ['01050AL', sleipner01050],
  ['KITVOLVODPH/DPR', volvoDphDprKit],
  ['KITVOLVODPH-DPR-AL', volvoDphDprKit],
  ['KITVOLVODPH-DPR-MG', volvoDphDprKit],
])

export function productImage(product) {
  return product ? imageBySku.get(product.sku) || null : null
}

export const DEMO_IMAGE_NOTE = 'Catalogue image shown for demonstration. Replace with supplier-approved production imagery before launch.'
