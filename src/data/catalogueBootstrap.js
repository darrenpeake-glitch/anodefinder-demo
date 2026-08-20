import { products } from './products.js'
import { sleipnerCatalogue } from './sleipnerCatalogue.js'

// Sprint 0 demo bridge: technical catalogue data is authoritative for
// compatibility fields, while an existing priced trade-list record keeps
// its commercial cost/source. Production should do this merge server-side.
for (const technical of sleipnerCatalogue) {
  const priced = products.find((product) => product.sku === technical.sku)

  if (priced) {
    const commercialSource = priced.source
    const tradeExVat = priced.tradeExVat

    Object.assign(priced, technical, {
      tradeExVat,
      source: commercialSource,
      technicalSource: technical.source,
      catalogueOnly: false,
    })
  } else {
    products.push(technical)
  }
}
