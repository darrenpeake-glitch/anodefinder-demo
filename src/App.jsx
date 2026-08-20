import { useMemo, useState } from 'react'
import { products, retailPriceExVat, retailPriceIncVat, money, TARGET_MARGIN, FLOOR_MARGIN } from './data/products.js'
import { mercuryCatalogue } from './data/mercuryCatalogue.js'
import MyBoat from './MyBoat.jsx'

// Remove legacy demo records that have been replaced by canonical catalogue SKUs.
const legacyProductSkus = new Set(['KITBRAVOI AL'])
const catalogueProducts = [...products.filter((product) => !legacyProductSkus.has(product.sku)), ...mercuryCatalogue]
const categories = ['All','Volvo Penta','Mercury / MerCruiser','Sleipner']
const applications = ['All', ...Array.from(new Set(catalogueProducts.map((p) => p.kind))).sort()]

function hasPrice(product) {
  return Number.isFinite(product?.tradeExVat)
}

function materialGuidance(material) {
  if (material === 'Zinc') return 'Commonly used in salt water. Confirm material suitability for your vessel and operating water before ordering.'
  if (material === 'Aluminium') return 'A modern general-purpose anode material widely used in salt and brackish water. Confirm suitability for your installation.'
  if (material === 'Magnesium') return 'Normally intended for fresh-water use. Do not select by material alone; verify the equipment maker’s guidance.'
  if (material.includes('Aluminium')) return 'This kit contains more than one anode material. Confirm the complete kit is correct for your drive and operating water.'
  return 'Confirm material suitability for your vessel and operating water before ordering.'
}

function matchesWater(product, water) {
  if (water === 'Any') return true
  const material = product.material.toLowerCase()
  if (water === 'Salt') return material.includes('zinc') || material.includes('aluminium')
  if (water === 'Brackish') return material.includes('aluminium')
  if (water === 'Fresh') return material.includes('magnesium')
  return true
}

function containingKits(product) {
  if (!product || product.kind === 'Engine anode kit') return []
  return catalogueProducts.filter((candidate) =>
    candidate.kind === 'Engine anode kit' &&
    (candidate.kitContents || []).some((item) => item.sku === product.sku)
  )
}

function priceLabel(product) {
  return hasPrice(product) ? money(retailPriceIncVat(product.tradeExVat)) : 'Price pending'
}

function searchScore(product, q) {
  if (!q) {
    return (product.kind === 'Engine anode kit' ? 20 : 0) + (hasPrice(product) ? 10 : 0)
  }

  const sku = product.sku.toLowerCase()
  const catalogueSku = (product.catalogueSku || '').toLowerCase()
  const oem = (product.oem || []).map((value) => String(value).toLowerCase())
  const aliases = (product.aliases || []).map((value) => String(value).toLowerCase())
  const equipment = (product.equipment || []).map((value) => String(value).toLowerCase())

  let score = 0
  if (sku === q || catalogueSku === q || oem.includes(q)) score += 1000
  else if (sku.startsWith(q) || catalogueSku.startsWith(q) || oem.some((value) => value.startsWith(q))) score += 700
  if (equipment.includes(q)) score += 500
  if (aliases.includes(q)) score += 450
  if (equipment.some((value) => value.includes(q))) score += 300
  if (aliases.some((value) => value.includes(q))) score += 250
  if (product.kind === 'Engine anode kit') score += 35
  if (hasPrice(product)) score += 20
  return score
}

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [equipment, setEquipment] = useState('All')
  const [application, setApplication] = useState('All')
  const [water, setWater] = useState('Any')
  const [selected, setSelected] = useState(null)
  const [basket, setBasket] = useState([])
  const [checkout, setCheckout] = useState(false)
  const [demoOrder, setDemoOrder] = useState(null)

  const equipmentOptions = useMemo(() => {
    const source = category === 'All' ? catalogueProducts : catalogueProducts.filter((p) => p.applicationBrand === category)
    return ['All', ...Array.from(new Set(source.flatMap((p) => p.equipment || []))).sort((a,b) => a.localeCompare(b, undefined, { numeric:true }))]
  }, [category])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalogueProducts.filter((p) => {
      const categoryMatch = category === 'All' || p.applicationBrand === category
      const equipmentMatch = equipment === 'All' || (p.equipment || []).includes(equipment)
      const applicationMatch = application === 'All' || p.kind === application
      const waterMatch = matchesWater(p, water)
      if (!categoryMatch || !equipmentMatch || !applicationMatch || !waterMatch) return false
      if (!q) return true

      const kitSkus = (p.kitContents || []).map((item) => item.sku)
      const haystack = [
        p.sku,
        p.catalogueSku || '',
        p.brand,
        p.applicationBrand,
        p.use,
        p.kind,
        p.material,
        ...(p.oem || []),
        ...(p.equipment || []),
        ...(p.aliases || []),
        ...kitSkus,
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    }).sort((a, b) => {
      const scoreDifference = searchScore(b, q) - searchScore(a, q)
      if (scoreDifference) return scoreDifference
      return a.sku.localeCompare(b.sku, undefined, { numeric:true })
    })
  }, [query, category, equipment, application, water])

  const related = selected ? catalogueProducts.filter((p) => p.sku !== selected.sku && p.oem.some((ref) => selected.oem.includes(ref))) : []
  const kitsForSelected = containingKits(selected)
  const basketTotal = basket.reduce((sum, item) => sum + retailPriceIncVat(item.tradeExVat), 0)

  function addToBasket(product) {
    if (!hasPrice(product)) return
    setBasket((items) => [...items, product])
    setSelected(null)
  }

  function quickAdd(product) {
    if (!hasPrice(product)) return
    setBasket((items) => [...items, product])
  }

  function removeFromBasket(index) {
    setBasket((items) => items.filter((_, i) => i !== index))
  }

  function chooseCategory(value) {
    setCategory(value)
    setEquipment('All')
  }

  function resetFinder() {
    setQuery('')
    setCategory('All')
    setEquipment('All')
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
        <a className="myboat-nav" href="#my-boat">My Boat</a>
        <button className="basket-button" onClick={() => setCheckout(true)}>Basket <span>{basket.length}</span></button>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow">Marine anodes without the catalogue headache</div>
          <h1>Find the right anode for your boat.</h1>
          <p>Know a part number, drive model or manufacturer? Search everything from one box.</p>
          <div className="searchbox">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try 838929, DPH, Alpha One, 821630, 00820AL..." />
          </div>
          <div className="quicklinks">
            {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => chooseCategory(item)}>{item}</button>)}
          </div>
        </section>

        <section className="promise-grid">
          <article><strong>1. Identify</strong><span>Search an OEM number or tell us what equipment you have.</span></article>
          <article><strong>2. Buy</strong><span>Get the compatible individual anode or complete drive kit.</span></article>
          <article><strong>3. Direct fulfilment</strong><span>Your order routes to the supplier for delivery to you.</span></article>
        </section>

        <section className="finder">
          <div className="finder-copy">
            <div className="eyebrow">Guided finder</div>
            <h2>Know the equipment, not the part?</h2>
            <p>Use the selectors instead. Both routes search the same product and compatibility data underneath.</p>
          </div>
          <div className="finder-controls finder-controls-four">
            <label><span>Manufacturer</span><select value={category} onChange={(e) => chooseCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Drive / equipment</span><select value={equipment} onChange={(e) => setEquipment(e.target.value)}>{equipmentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Part type</span><select value={application} onChange={(e) => setApplication(e.target.value)}>{applications.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Operating water</span><select value={water} onChange={(e) => setWater(e.target.value)}><option>Any</option><option>Salt</option><option>Brackish</option><option>Fresh</option></select></label>
            <button className="reset" onClick={resetFinder}>Reset finder</button>
          </div>
          {category !== 'All' && equipment !== 'All' && <div className="finder-confirmation">Showing verified demo records associated with <strong>{category} {equipment}</strong>. Priced, purchasable records are prioritised; catalogue-only matches remain visible when commercial data is still missing.</div>}
          {water === 'Fresh' && <div className="finder-warning">Fresh-water filtering only returns magnesium records. Where a trade price has not been reconciled, the part remains visible as catalogue-only rather than receiving an invented price.</div>}
        </section>

        <MyBoat products={catalogueProducts} onViewProduct={setSelected} onAddProduct={addToBasket} />

        <section className="catalogue">
          <div className="section-head">
            <div><div className="eyebrow">Verified demo catalogue</div><h2>{filtered.length} matching products</h2></div>
            <div className="pricing-note">Priced records: {Math.round(TARGET_MARGIN * 100)}% target margin · {Math.round(FLOOR_MARGIN * 100)}% policy floor</div>
          </div>

          <div className="product-grid">
            {filtered.map((product) => {
              const kitCount = containingKits(product).length
              return (
                <article className="product-card" key={product.sku}>
                  <div className="product-art"><span>{product.kind === 'Engine anode kit' ? 'KIT' : product.material.slice(0,2).toUpperCase()}</span></div>
                  <div className="product-meta">{product.applicationBrand} · {product.material}</div>
                  <h3>{product.use}</h3>
                  <div className="sku">Tecnoseal {product.sku}</div>
                  {product.equipment?.length > 0 && <div className="equipment-line">Fits demo equipment: {product.equipment.join(' · ')}</div>}
                  {product.oem.length > 0 && <div className="oem">OEM ref: {product.oem.join(' / ')}</div>}
                  {kitCount > 0 && <div className="kit-badge">Complete kit available</div>}
                  {product.catalogueOnly && <div className="catalogue-badge">Verified compatibility · price not loaded</div>}
                  <div className="price-row"><div><strong>{priceLabel(product)}</strong><span>{hasPrice(product) ? ' inc VAT' : ' catalogue record'}</span></div><div className="card-actions"><button onClick={() => setSelected(product)}>View</button>{hasPrice(product) && <button className="buy-now" onClick={() => quickAdd(product)}>Add</button>}</div></div>
                </article>
              )
            })}
          </div>
          {filtered.length === 0 && <div className="empty">No verified demo products match those selections yet. Try resetting the finder or use the global search above.</div>}
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
            <div className="detail-art"><span>{selected.kind === 'Engine anode kit' ? 'KIT' : selected.material.slice(0,2).toUpperCase()}</span></div>
            <div className="eyebrow">{selected.applicationBrand} · {selected.material}</div>
            <h2>{selected.use}</h2>
            <div className="detail-code">Tecnoseal {selected.sku}</div>
            <dl>
              <div><dt>Drive / equipment</dt><dd>{selected.equipment?.length ? selected.equipment.join(' / ') : 'General application'}</dd></div>
              <div><dt>OEM reference</dt><dd>{selected.oem.length ? selected.oem.join(' / ') : '—'}</dd></div>
              <div><dt>Material</dt><dd>{selected.material}</dd></div>
              <div><dt>Supplier source</dt><dd>{selected.source}</dd></div>
              {selected.cataloguePage && <div><dt>2026 catalogue page</dt><dd>{selected.cataloguePage}</dd></div>}
              {selected.hardwareIncluded !== undefined && <div><dt>Hardware</dt><dd>{selected.hardwareIncluded ? 'Included' : 'Not included'}</dd></div>}
              <div><dt>Commercial status</dt><dd>{hasPrice(selected) ? 'Trade price loaded' : 'Compatibility verified · price pending'}</dd></div>
              {hasPrice(selected) && <div><dt>Retail ex VAT</dt><dd>{money(retailPriceExVat(selected.tradeExVat))}</dd></div>}
              {hasPrice(selected) && <div><dt>Retail inc VAT</dt><dd>{money(retailPriceIncVat(selected.tradeExVat))}</dd></div>}
            </dl>
            {selected.kitContents?.length > 0 && <div className="kit-contents"><strong>Kit contents</strong>{selected.kitContents.map((item) => <div key={item.sku}><span>{item.qty} × Tecnoseal {item.sku}</span><button onClick={() => { const component = catalogueProducts.find((p) => p.sku === item.sku); if (component) setSelected(component) }}>{catalogueProducts.some((p) => p.sku === item.sku) ? 'View component' : 'Catalogue component'}</button></div>)}</div>}
            {kitsForSelected.length > 0 && <div className="kit-options"><strong>Prefer the complete kit?</strong><span>This individual anode is included in the following verified kit{kitsForSelected.length > 1 ? 's' : ''}:</span>{kitsForSelected.map((kit) => <button key={kit.sku} onClick={() => setSelected(kit)}><span>{kit.use} · {kit.material}</span><strong>{priceLabel(kit)}</strong></button>)}</div>}
            <div className="material-note"><strong>Material guidance</strong><span>{materialGuidance(selected.material)}</span></div>
            {related.length > 0 && <div className="related"><strong>Same OEM reference</strong>{related.map((item) => <button key={item.sku} onClick={() => setSelected(item)}>{item.sku} · {item.material} · {priceLabel(item)}</button>)}</div>}
            <div className="verification">Compatibility and dimensions must be verified against current technical data before commercial launch.</div>
            {hasPrice(selected) ? <button className="primary" onClick={() => addToBasket(selected)}>Add to demo basket · {priceLabel(selected)}</button> : <div className="price-pending">Compatibility is loaded from the 2026 catalogue. This item stays non-purchasable until its current trade cost is reconciled.</div>}
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
