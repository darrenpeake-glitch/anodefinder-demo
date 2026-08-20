const imageBySku = new Map([
  ['KITALPHAONE/AL', 'https://www.tecnoseal-online-catalogue.it/slir/c1x1/source/foto_catalogo/4.1/kitalphaoneal.png'],
])

export function productImage(product) {
  return product ? imageBySku.get(product.sku) || null : null
}

export const DEMO_IMAGE_NOTE = 'Official Tecnoseal online-catalogue image shown for demonstration. Confirm supplier permission/asset delivery before commercial launch.'
