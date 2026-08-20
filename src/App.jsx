import { useMemo, useState } from 'react'
import { products, retailPriceExVat, retailPriceIncVat, money, TARGET_MARGIN, FLOOR_MARGIN } from './data/products.js'

const categories = ['All','Volvo Penta','Mercury / MerCruiser','Sleipner']

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState(null)
  const [basket, setBasket] = useState([])
  const [checkout, setCheckout] = useState(false)
  const [demoOrder, setDemoOrder] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const categoryMatch = category === 'All' || p.applicationBrand === category
      if (!categoryMatch) return false
      if (!q) return true
      const haystack = [p.sku, p.brand, p.applicationBrand, p.use, p.material, ...p.oem].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [query, category])

  const basketTotal = basket.reduce((sum, item) => sum + retailPriceIncVat(item.tradeExVat), 0)

  function addToBasket(product) {
    setBasket((items) => [...items, product])
    setSelected(null)
  }

  function placeDemoOrder() {
    const orderNo = `DEMO-${String(Math.floor(Math.random() * 90000) + 10000)}`
    setDemoOrder(orderNo)
    setBasket([])
    setCheckout(false)
  }

  return (
    <div>
      <header className="topbar">
        <div className="brandmark">AF</div>
        <div className="brandcopy">
          <strong>AnodeFinder</strong>
          <span>Demo storefront</span>
        </div>
        <button className="basket-button" onClick={() => setCheckout(true)}>
          Basket <span>{basket.length}</span>
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow">Marine anodes without the catalogue headache</div>
          <h1>Find the right anode for your boat.</h1>
          <p>Search by engine or drive manufacturer, Tecnoseal code, OEM reference or application.</p>
          <div className="searchbox">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 838929, 00714AL, Volvo Penta, bow thruster..."
            />
          </div>
          <div className="quicklinks">
            {categories.map((item) => (
              <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </section>

        <section className="promise-grid">
          <article><strong>1. Identify</strong><span>Match by OEM reference, equipment and material.</span></article>
          <article><strong>2. Buy</strong><span>Clear retail pricing calculated from supplier trade cost.</span></article>
          <article><strong>3. Direct fulfilment</strong><span>Order routes to the supplier for delivery to the customer.</span></article>
        </section>

        <section className="catalogue">
          <div className="section-head">
            <div>
              <div className="eyebrow">Sprint 0 catalogue</div>
              <h2>{filtered.length} matching products</h2>
            </div>
            <div className="pricing-note">Demo pricing: {Math.round(TARGET_MARGIN * 100)}% target margin · {Math.round(FLOOR_MARGIN * 100)}% policy floor</div>
          </div>

          <div className="product-grid">
            {filtered.map((product) => (
              <article className="product-card" key={product.sku}>
                <div className="product-art"><span>{product.material.slice(0,2).toUpperCase()}</span></div>
                <div className="product-meta">{product.applicationBrand} · {product.material}</div>
                <h3>{product.use}</h3>
                <div className="sku">Tecnoseal {product.sku}</div>
                {product.oem.length > 0 && <div className="oem">OEM ref: {product.oem.join(' / ')}</div>}
                <div className="price-row">
                  <div><strong>{money(retailPriceIncVat(product.tradeExVat))}</strong><span> inc VAT</span></div>
                  <button onClick={() => setSelected(product)}>View</button>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && <div className="empty">No demo products match that search yet.</div>}
        </section>

        <section className="workflow">
          <div className="eyebrow">What happens after checkout</div>
          <h2>Automate the normal. Escalate the weird.</h2>
          <div className="flowline">
            {['Customer order','Payment','Supplier PO','Supplier accepted','Direct dispatch','Tracking','Delivered'].map((step, index) => (
              <div key={step} className="flowstep"><span>{index + 1}</span>{step}</div>
            ))}
          </div>
          <p>Production integrations are not active in this demo. The purpose is to prove the customer journey and supplier-routing model.</p>
        </section>
      </main>

      <footer>
        <strong>AnodeFinder demo</strong>
        <span>Independent proof of concept. Manufacturer names and OEM numbers are compatibility references only.</span>
      </footer>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <div className="eyebrow">{selected.applicationBrand} · {selected.material}</div>
            <h2>{selected.use}</h2>
            <div className="detail-code">Tecnoseal {selected.sku}</div>
            <dl>
              <div><dt>OEM reference</dt><dd>{selected.oem.length ? selected.oem.join(' / ') : '—'}</dd></div>
              <div><dt>Material</dt><dd>{selected.material}</dd></div>
              <div><dt>Supplier source</dt><dd>{selected.source}</dd></div>
              <div><dt>Trade cost</dt><dd>Hidden in production</dd></div>
              <div><dt>Retail ex VAT</dt><dd>{money(retailPriceExVat(selected.tradeExVat))}</dd></div>
              <div><dt>Retail inc VAT</dt><dd>{money(retailPriceIncVat(selected.tradeExVat))}</dd></div>
            </dl>
            <div className="verification">Compatibility must be verified against current technical data before commercial launch.</div>
            <button className="primary" onClick={() => addToBasket(selected)}>Add to demo basket</button>
          </div>
        </div>
      )}

      {checkout && (
        <div className="overlay" onClick={() => setCheckout(false)}>
          <div className="modal checkout" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setCheckout(false)}>×</button>
            <div className="eyebrow">Simulated checkout</div>
            <h2>Your basket</h2>
            {basket.length === 0 ? <p>Your demo basket is empty.</p> : (
              <>
                <div className="basket-lines">
                  {basket.map((item, i) => <div key={`${item.sku}-${i}`}><span>{item.sku} · {item.use}</span><strong>{money(retailPriceIncVat(item.tradeExVat))}</strong></div>)}
                </div>
                <div className="basket-total"><span>Total inc VAT</span><strong>{money(basketTotal)}</strong></div>
                <div className="demo-address">Demo flow: customer address → supplier purchase order → direct delivery.</div>
                <button className="primary" onClick={placeDemoOrder}>Place demo order</button>
              </>
            )}
          </div>
        </div>
      )}

      {demoOrder && (
        <div className="toast" onClick={() => setDemoOrder(null)}>
          <strong>{demoOrder} created</strong>
          <span>Next step: generate supplier PO and route for direct fulfilment.</span>
        </div>
      )}
    </div>
  )
}
