import { useMemo, useState } from 'react'
import { products, retailPriceExVat, retailPriceIncVat, money, TARGET_MARGIN, FLOOR_MARGIN } from './data/products.js'

const categories = ['All','Volvo Penta','Mercury / MerCruiser','Sleipner']
const applications = ['All','Pencil anode','Plate anode','Collar anode','Bar anode','Skeg anode','Bow thruster anode','Engine anode kit']

function materialGuidance(material) {
  if (material === 'Zinc') return 'Commonly used in salt water. Confirm material suitability for your vessel and operating water before ordering.'
  if (material === 'Aluminium') return 'A modern general-purpose anode material widely used in salt and brackish water. Confirm suitability for your installation.'
  if (material === 'Magnesium') return 'Normally intended for fresh-water use. Do not select by material alone; verify the equipment maker’s guidance.'
  return 'Confirm material suitability for your vessel and operating water before ordering.'
}

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [application, setApplication] = useState('All')
  const [water, setWater] = useState('Any')
  const [selected, setSelected] = useState(null)
  const [basket, setBasket] = useState([])
  const [checkout, setCheckout] = useState(false)
  const [demoOrder, setDemoOrder] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const categoryMatch = category === 'All' || p.applicationBrand === category
      const applicationMatch = application === 'All' || p.use.toLowerCase().includes(application.replace('Engine anode kit','engine anode kit').toLowerCase())
      const waterMatch = water === 'Any' ||
        (water === 'Salt' && ['Zinc','Aluminium'].includes(p.material)) ||
        (water === 'Brackish' && p.material === 'Aluminium') ||
        (water === 'Fresh' && p.material === 'Magnesium')
      if (!categoryMatch || !applicationMatch || !waterMatch) return false
      if (!q) return true
      const haystack = [p.sku, p.brand, p.applicationBrand, p.use, p.material, ...p.oem].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [query, category, application, water])

  const related = selected ? products.filter((p) => p.sku !== selected.sku && p.oem.some((ref) => selected.oem.includes(ref))) : []
  const basketTotal = basket.reduce((sum, item) => sum + retailPriceIncVat(item.tradeExVat), 0)

  function addToBasket(product) {
    setBasket((items) => [...items, product])
    setSelected(null)
  }

  function removeFromBasket(index) {
    setBasket((items) => items.filter((_, i) => i !== index))
  }

  function resetFinder() {
    setQuery('')
    setCategory('All')
    setApplication('All')
    setWater('Any')
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
        <div className="brandcopy"><strong>AnodeFinder</strong><span>Demo storefront</span></div>
        <button className="basket-button" onClick={() => setCheckout(true)}>Basket <span>{basket.length}</span></button>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow">Marine anodes without the catalogue headache</div>
          <h1>Find the right anode for your boat.</h1>
          <p>Search by engine or drive manufacturer, Tecnoseal code, OEM reference or application.</p>
          <div className="searchbox">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try 838929, 00714AL, Volvo Penta, bow thruster..." />
          </div>
          <div className="quicklinks">
            {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
        </section>

        <section className="promise-grid">
          <article><strong>1. Identify</strong><span>Match by OEM reference, equipment and material.</span></article>
          <article><strong>2. Buy</strong><span>Clear retail pricing calculated from supplier trade cost.</span></article>
          <article><strong>3. Direct fulfilment</strong><span>Order routes to the supplier for delivery to the customer.</span></article>
        </section>

        <section className="finder">
          <div className="finder-copy">
            <div className="eyebrow">Guided finder</div>
            <h2>Don’t know the part number?</h2>
            <p>Narrow the demo catalogue by what you know. In production this becomes the compatibility journey: equipment → application → water → verified part.</p>
          </div>
          <div className="finder-controls">
            <label><span>Manufacturer</span><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Application</span><select value={application} onChange={(e) => setApplication(e.target.value)}>{applications.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Operating water</span><select value={water} onChange={(e) => setWater(e.target.value)}><option>Any</option><option>Salt</option><option>Brackish</option><option>Fresh</option></select></label>
            <button className="reset" onClick={resetFinder}>Reset finder</button>
          </div>
          {water === 'Fresh' && <div className="finder-warning">The current Sprint 0 sample contains no magnesium products, so fresh-water filtering may return no results. That is intentional rather than substituting an unverified material.</div>}
        </section>

        <section className="catalogue">
          <div className="section-head">
            <div><div className="eyebrow">Sprint 0 catalogue</div><h2>{filtered.length} matching products</h2></div>
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
                <div className="price-row"><div><strong>{money(retailPriceIncVat(product.tradeExVat))}</strong><span> inc VAT</span></div><button onClick={() => setSelected(product)}>View</button></div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && <div className="empty">No verified demo products match those selections yet. Try resetting the finder or searching by OEM reference.</div>}
        </section>

        <section className="workflow">
          <div className="eyebrow">What happens after checkout</div>
          <h2>Automate the normal. Escalate the weird.</h2>
          <div className="flowline">
            {['Customer order','Payment','Supplier PO','Supplier accepted','Direct dispatch','Tracking','Delivered'].map((step, index) => <div key={step} className="flowstep"><span>{index + 1}</span>{step}</div>)}
          </div>
          <p>Production integrations are not active in this demo. The purpose is to prove the customer journey and supplier-routing model.</p>
        </section>
      </main>

      <footer><strong>AnodeFinder demo</strong><span>Independent proof of concept. Manufacturer names and OEM numbers are compatibility references only.</span></footer>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <div className="detail-art"><span>{selected.material.slice(0,2).toUpperCase()}</span></div>
            <div className="eyebrow">{selected.applicationBrand} · {selected.material}</div>
            <h2>{selected.use}</h2>
            <div className="detail-code">Tecnoseal {selected.sku}</div>
            <dl>
              <div><dt>OEM reference</dt><dd>{selected.oem.length ? selected.oem.join(' / ') : '—'}</dd></div>
              <div><dt>Material</dt><dd>{selected.material}</dd></div>
              <div><dt>Supplier source</dt><dd>{selected.source}</dd></div>
              <div><dt>Retail ex VAT</dt><dd>{money(retailPriceExVat(selected.tradeExVat))}</dd></div>
              <div><dt>Retail inc VAT</dt><dd>{money(retailPriceIncVat(selected.tradeExVat))}</dd></div>
            </dl>
            <div className="material-note"><strong>Material guidance</strong><span>{materialGuidance(selected.material)}</span></div>
            {related.length > 0 && <div className="related"><strong>Same OEM reference</strong>{related.map((item) => <button key={item.sku} onClick={() => setSelected(item)}>{item.sku} · {item.material} · {money(retailPriceIncVat(item.tradeExVat))}</button>)}</div>}
            <div className="verification">Compatibility and dimensions must be verified against current technical data before commercial launch.</div>
            <button className="primary" onClick={() => addToBasket(selected)}>Add to demo basket · {money(retailPriceIncVat(selected.tradeExVat))}</button>
          </div>
        </div>
      )}

      {checkout && (
        <div className="overlay" onClick={() => setCheckout(false)}>
          <div className="modal checkout" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setCheckout(false)}>×</button>
            <div className="eyebrow">Simulated checkout</div><h2>Your basket</h2>
            {basket.length === 0 ? <p>Your demo basket is empty.</p> : <>
              <div className="basket-lines">{basket.map((item, i) => <div key={`${item.sku}-${i}`}><span>{item.sku} · {item.use}</span><strong>{money(retailPriceIncVat(item.tradeExVat))}</strong><button className="remove" onClick={() => removeFromBasket(i)}>Remove</button></div>)}</div>
              <div className="basket-total"><span>Total inc VAT</span><strong>{money(basketTotal)}</strong></div>
              <div className="checkout-grid"><label><span>Name</span><input placeholder="Demo customer" /></label><label><span>Postcode</span><input placeholder="PL1 2AB" /></label></div>
              <div className="demo-address">Demo only — no payment or customer data is transmitted. Production flow: customer order → supplier PO → direct delivery.</div>
              <button className="primary" onClick={placeDemoOrder}>Place demo order</button>
            </>}
          </div>
        </div>
      )}

      {demoOrder && <div className="toast" onClick={() => setDemoOrder(null)}><strong>{demoOrder} created</strong><span>Supplier PO would now be generated and routed for direct fulfilment.</span></div>}
    </div>
  )
}
