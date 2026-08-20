import { useMemo, useState } from 'react'
import { products, retailPriceExVat, retailPriceIncVat, money, TARGET_MARGIN, FLOOR_MARGIN } from './data/products.js'
import { mercuryCatalogue } from './data/mercuryCatalogue.js'
import { buildSupplierEmail } from './data/supplierEmail.js'
import MyBoat from './MyBoat.jsx'
import SupplierEmailPanel from './SupplierEmailPanel.jsx'
import ProductArt from './ProductArt.jsx'

// Remove legacy demo records that have been replaced by canonical catalogue SKUs.
const legacyProductSkus = new Set(['KITBRAVOI AL'])
const catalogueProducts = [...products.filter((product) => !legacyProductSkus.has(product.sku)), ...mercuryCatalogue]
const categories = ['All','Volvo Penta','Mercury / MerCruiser','Sleipner']
const applications = ['All', ...Array.from(new Set(catalogueProducts.map((p) => p.kind))).sort()]
const emptyCustomer = { name:'', email:'', address:'', town:'', postcode:'' }

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
  const [checkoutCustomer, setCheckoutCustomer] = useState(emptyCustomer)
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
  const basketLines = useMemo(() => {
    const lines = new Map()
    basket.forEach((product) => {
      const current = lines.get(product.sku)
      if (current) current.qty += 1
      else lines.set(product.sku, { product, qty:1 })
    })
    return [...lines.values()]
  }, [basket])
  const basketTotal = basket.reduce((sum, item) => sum + retailPriceIncVat(item.tradeExVat), 0)
  const checkoutReady = basket.length > 0 && Object.values(checkoutCustomer).every((value) => value.trim())

  function addToBasket(product) {
    if (!hasPrice(product)) return
    setBasket((items) => [...items, product])
    setSelected(null)
  }

  function quickAdd(product) {
    if (!hasPrice(product)) return
    setBasket((items) => [...items, product])
  }

  function setBasketQuantity(product, quantity) {
    const qty = Math.max(0, Math.min(99, Number(quantity) || 0))
    setBasket((items) => {
      const withoutSku = items.filter((item) => item.sku !== product.sku)
      return [...withoutSku, ...Array.from({ length:qty }, () => product)]
    })
  }

  function removeFromBasket(sku) {
    setBasket((items) => items.filter((item) => item.sku !== sku))
  }

  function updateCheckoutCustomer(field, value) {
    setCheckoutCustomer((customer) => ({ ...customer, [field]:value }))
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
    if (!checkoutReady) return

    const numericId = String(Math.floor(Math.random() * 90000) + 10000)
    const orderNo = `ORD-${numericId}`
    const poNumber = `PO-${numericId}-TSE`
    const orderLines = basketLines.map(({ product, qty }) => ({
      sku: product.sku,
      description: product.use,
      material: product.material,
      qty,
      unitRetailIncVat: retailPriceIncVat(product.tradeExVat),
      lineTotalIncVat: retailPriceIncVat(product.tradeExVat) * qty,
    }))

    const customerOrder = {
      orderNo,
      status: 'PAID',
      createdAt: new Date().toISOString(),
      customer: { ...checkoutCustomer },
      lines: orderLines,
      productsTotalIncVat: basketTotal,
      delivery: {
        method: 'SUPPLIER_DIRECT',
        chargeStatus: 'PENDING_SUPPLIER_CONFIRMATION',
      },
      currentTotalIncVat: basketTotal,
    }

    const supplierOrder = {
      poNumber,
      supplierCode: 'TSE',
      supplierName: 'Tecnoseal UK',
      status: 'PO_EMAIL_READY',
      customerOrderNo: orderNo,
      fulfilment: 'DIRECT_TO_CUSTOMER',
      shipTo: {
        name: checkoutCustomer.name,
        address: checkoutCustomer.address,
        town: checkoutCustomer.town,
        postcode: checkoutCustomer.postcode,
      },
      lines: orderLines.map(({ sku, qty }) => ({ sku, qty })),
      commercialPricing: 'INTERNAL_ONLY_NOT_EXPOSED_IN_DEMO',
    }

    supplierOrder.email = buildSupplierEmail(supplierOrder)
    setDemoOrder({ customerOrder, supplierOrder })
    setBasket([])
    setCheckout(false)
    setCheckoutCustomer(emptyCustomer)
  }

  function markSupplierEmailSent() {
    setDemoOrder((order) => {
      if (!order) return order
      return {
        ...order,
        supplierOrder: {
          ...order.supplierOrder,
          status: 'SENT_TO_SUPPLIER',
          email: {
            ...order.supplierOrder.email,
            status: 'SENT_TO_SUPPLIER',
            sentAt: new Date().toISOString(),
          },
        },
      }
    })
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
                  <ProductArt product={product} />
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
            {['Customer order','Payment','PO email','Supplier accepted','Direct dispatch','Tracking','Delivered'].map((step, index) => <div key={step} className="flowstep"><span>{index + 1}</span>{step}</div>)}
          </div>
          <p>V1 routes paid orders to the supplier by structured email. Supplier acknowledgement, delays and dispatch can initially be handled manually while the business is proven.</p>
        </section>
      </main>

      <footer><strong>AnodeFinder demo</strong><span>Independent proof of concept. Manufacturer names and OEM numbers are compatibility references only.</span></footer>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>×</button>
            <ProductArt product={selected} detail />
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
          <div className="modal checkout checkout-wide" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setCheckout(false)}>×</button>
            <div className="eyebrow">Simulated checkout</div><h2>Your basket</h2>
            {basket.length === 0 ? <p>Your demo basket is empty.</p> : <div className="checkout-layout">
              <div>
                <div className="basket-lines grouped-basket">{basketLines.map(({ product, qty }) => <div className="basket-line" key={product.sku}>
                  <div className="basket-product"><strong>{product.use}</strong><span>Tecnoseal {product.sku} · {product.material}</span></div>
                  <div className="quantity-control"><button onClick={() => setBasketQuantity(product, qty - 1)}>−</button><input aria-label={`Quantity for ${product.sku}`} type="number" min="1" max="99" value={qty} onChange={(e) => setBasketQuantity(product, e.target.value)} /><button onClick={() => setBasketQuantity(product, qty + 1)}>+</button></div>
                  <strong>{money(retailPriceIncVat(product.tradeExVat) * qty)}</strong>
                  <button className="remove" onClick={() => removeFromBasket(product.sku)}>Remove</button>
                </div>)}</div>

                <div className="delivery-panel"><strong>Supplier-direct delivery</strong><span>V1 will submit the paid order to Tecnoseal by structured purchase-order email. Availability and carriage can be confirmed by the supplier during fulfilment.</span></div>

                <div className="checkout-grid checkout-address">
                  <label><span>Name</span><input value={checkoutCustomer.name} onChange={(e) => updateCheckoutCustomer('name', e.target.value)} placeholder="Demo customer" /></label>
                  <label><span>Email</span><input value={checkoutCustomer.email} onChange={(e) => updateCheckoutCustomer('email', e.target.value)} type="email" placeholder="customer@example.com" /></label>
                  <label className="address-wide"><span>Address</span><input value={checkoutCustomer.address} onChange={(e) => updateCheckoutCustomer('address', e.target.value)} placeholder="1 Marina Road" /></label>
                  <label><span>Town / city</span><input value={checkoutCustomer.town} onChange={(e) => updateCheckoutCustomer('town', e.target.value)} placeholder="Plymouth" /></label>
                  <label><span>Postcode</span><input value={checkoutCustomer.postcode} onChange={(e) => updateCheckoutCustomer('postcode', e.target.value)} placeholder="PL1 2AB" /></label>
                </div>
              </div>

              <aside className="order-summary">
                <div className="order-summary-head"><span>Order summary</span><strong>{basket.length} item{basket.length === 1 ? '' : 's'}</strong></div>
                <div><span>Products inc VAT</span><strong>{money(basketTotal)}</strong></div>
                <div><span>Supplier fulfilment</span><strong>Email PO</strong></div>
                <div className="order-total"><span>Current demo total</span><strong>{money(basketTotal)}</strong></div>
                <small>Carriage is not invented in the demo; production terms must be agreed before launch.</small>
                <div className="demo-address">Demo only — payment is simulated and no customer data is transmitted. Placing the order creates the customer transaction and a ready-to-send supplier email locally in this page.</div>
                <button className="primary" disabled={!checkoutReady} onClick={placeDemoOrder}>Simulate payment & create PO email</button>
                {!checkoutReady && <small className="checkout-required">Complete all delivery fields to create the demo transaction.</small>}
              </aside>
            </div>}
          </div>
        </div>
      )}

      {demoOrder && (
        <div className="overlay" onClick={() => setDemoOrder(null)}>
          <div className="modal transaction-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setDemoOrder(null)}>×</button>
            <div className="transaction-success"><span>✓</span><div><div className="eyebrow">Demo transaction created</div><h2>{demoOrder.customerOrder.orderNo}</h2><p>Payment has been simulated and the supplier purchase-order email has been generated.</p></div></div>

            <div className="transaction-flow">
              <div className="complete"><span>1</span><strong>PAID</strong><small>Customer order</small></div>
              <div className="complete"><span>2</span><strong>EMAIL READY</strong><small>Supplier PO</small></div>
              <div className={demoOrder.supplierOrder.status === 'SENT_TO_SUPPLIER' ? 'complete' : ''}><span>3</span><strong>{demoOrder.supplierOrder.status === 'SENT_TO_SUPPLIER' ? 'SENT' : 'NEXT'}</strong><small>Email supplier</small></div>
            </div>

            <div className="transaction-columns">
              <section>
                <div className="transaction-heading"><span>Customer order</span><strong>{demoOrder.customerOrder.orderNo}</strong></div>
                <dl>
                  <div><dt>Status</dt><dd>{demoOrder.customerOrder.status}</dd></div>
                  <div><dt>Customer</dt><dd>{demoOrder.customerOrder.customer.name}</dd></div>
                  <div><dt>Email</dt><dd>{demoOrder.customerOrder.customer.email}</dd></div>
                  <div><dt>Ship to</dt><dd>{demoOrder.customerOrder.customer.address}, {demoOrder.customerOrder.customer.town}, {demoOrder.customerOrder.customer.postcode}</dd></div>
                  <div><dt>Products inc VAT</dt><dd>{money(demoOrder.customerOrder.productsTotalIncVat)}</dd></div>
                  <div><dt>Delivery</dt><dd>Supplier confirmation</dd></div>
                </dl>
                <div className="transaction-lines">{demoOrder.customerOrder.lines.map((line) => <div key={line.sku}><span>{line.qty} × {line.sku}<small>{line.description} · {line.material}</small></span><strong>{money(line.lineTotalIncVat)}</strong></div>)}</div>
              </section>

              <section className="supplier-payload">
                <div className="transaction-heading"><span>Supplier PO</span><strong>{demoOrder.supplierOrder.poNumber}</strong></div>
                <dl>
                  <div><dt>Supplier</dt><dd>{demoOrder.supplierOrder.supplierName}</dd></div>
                  <div><dt>Status</dt><dd>{demoOrder.supplierOrder.status}</dd></div>
                  <div><dt>Channel</dt><dd>Email</dd></div>
                  <div><dt>Fulfilment</dt><dd>Direct to customer</dd></div>
                  <div><dt>Customer ref</dt><dd>{demoOrder.supplierOrder.customerOrderNo}</dd></div>
                  <div><dt>Postcode</dt><dd>{demoOrder.supplierOrder.shipTo.postcode}</dd></div>
                </dl>
                <div className="supplier-lines"><strong>PO lines</strong>{demoOrder.supplierOrder.lines.map((line) => <div key={line.sku}><span>Tecnoseal {line.sku}</span><strong>Qty {line.qty}</strong></div>)}</div>
                <div className="internal-note">No retail pricing or payment information is included in the supplier email. Production trade pricing remains server-side/account-side.</div>
              </section>
            </div>

            <SupplierEmailPanel supplierOrder={demoOrder.supplierOrder} onMarkSent={markSupplierEmailSent} />

            <div className="transaction-next"><strong>V1 operating model</strong><span>After the PO email is sent, AnodeFinder waits for Tecnoseal acknowledgement. Initially, availability, carriage, delays and tracking can be handled manually and recorded against {demoOrder.customerOrder.orderNo}.</span></div>
            <button className="primary" onClick={() => setDemoOrder(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
