export const products = [
  { sku:'00700', brand:'Tecnoseal', applicationBrand:'Volvo Penta', oem:['875810'], use:'Collar anode', material:'Zinc', tradeExVat:6.13, source:'Volvo Zinc' },
  { sku:'00708', brand:'Tecnoseal', applicationBrand:'Volvo Penta', oem:['852835'], use:'Bar anode', material:'Zinc', tradeExVat:9.60, source:'Volvo Zinc' },
  { sku:'00714', brand:'Tecnoseal', applicationBrand:'Volvo Penta', oem:['838929'], use:'Pencil anode', material:'Zinc', tradeExVat:2.61, source:'Volvo Zinc' },
  { sku:'00714AL', brand:'Tecnoseal', applicationBrand:'Volvo Penta', oem:['838929'], use:'Pencil anode', material:'Aluminium', tradeExVat:3.75, source:'Volvo Aluminium' },
  { sku:'00718AL', brand:'Tecnoseal', applicationBrand:'Volvo Penta', oem:['3854130'], use:'Plate anode', material:'Aluminium', tradeExVat:11.26, source:'Volvo Aluminium' },
  { sku:'00800', brand:'Tecnoseal', applicationBrand:'Mercury / MerCruiser', oem:['31640'], use:'Skeg anode', material:'Zinc', tradeExVat:6.94, source:'Mercury Mercruiser' },
  { sku:'00800AL', brand:'Tecnoseal', applicationBrand:'Mercury / MerCruiser', oem:['31640'], use:'Skeg anode', material:'Aluminium', tradeExVat:3.76, source:'Mercury Mercruiser' },
  { sku:'00814AL', brand:'Tecnoseal', applicationBrand:'Mercury / MerCruiser', oem:['821629'], use:'Plate anode', material:'Aluminium', tradeExVat:6.94, source:'Mercury Mercruiser' },
  { sku:'01050', brand:'Tecnoseal', applicationBrand:'Sleipner', oem:['61180'], use:'Bow thruster anode', material:'Zinc', tradeExVat:6.22, source:'Bowthruster' },
  { sku:'01052AL', brand:'Tecnoseal', applicationBrand:'Sleipner', oem:['71190A','51181A'], use:'Bow thruster anode', material:'Aluminium', tradeExVat:6.70, source:'Bowthruster' },
  { sku:'01053', brand:'Tecnoseal', applicationBrand:'Sleipner', oem:['501180'], use:'Bow thruster anode', material:'Zinc', tradeExVat:20.52, source:'Bowthruster' },
  { sku:'KITBRAVOI AL', brand:'Tecnoseal', applicationBrand:'Mercury / MerCruiser', oem:[], use:'Bravo I engine anode kit', material:'Aluminium', tradeExVat:20.70, source:'Engine Kits — revised Dec 2024' },
]

export const TARGET_MARGIN = 0.40
export const FLOOR_MARGIN = 0.33
export const VAT_RATE = 0.20

export function retailPriceExVat(cost) {
  return Math.ceil((cost / (1 - TARGET_MARGIN)) * 100) / 100
}

export function retailPriceIncVat(cost) {
  return Math.ceil(retailPriceExVat(cost) * (1 + VAT_RATE) * 100) / 100
}

export function money(value) {
  return new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP' }).format(value)
}
