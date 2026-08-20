const imageBySku = new Map([
  ['KITALPHAONE/AL', 'https://www.anodefactory.de/cdn/shop/products/KIT_MERCURY_ALPHA1_GEN2-e1558097383101_542x302.jpg?v=1633414785'],
])

export function productImage(product) {
  return product ? imageBySku.get(product.sku) || null : null
}

export const DEMO_IMAGE_NOTE = 'Third-party open-web product image shown for demonstration only. Replace with supplier-approved production imagery before launch.'
