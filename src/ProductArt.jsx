import { productImage } from './data/productImages.js'

export default function ProductArt({ product, detail = false }) {
  const image = productImage(product)
  const className = `${detail ? 'detail-art' : 'product-art'}${image ? ' has-product-image' : ''}`

  return (
    <div className={className}>
      {image ? (
        <img src={image} alt={`${product.use} – Tecnoseal ${product.sku}`} />
      ) : (
        <span>{product.kind === 'Engine anode kit' ? 'KIT' : product.material.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}
