import { useEffect, useMemo, useState } from 'react'
import { retailPriceIncVat, money } from './data/products.js'

const STORAGE_KEY = 'anodefinder.myboat.v1'

function loadBoat() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return saved && typeof saved === 'object' ? saved : null
  } catch {
    return null
  }
}

function materialMatches(product, water) {
  const material = (product.material || '').toLowerCase()
  if (water === 'Fresh') return material.includes('magnesium')
  if (water === 'Brackish') return material.includes('aluminium')
  if (water === 'Salt') return material.includes('zinc') || material.includes('aluminium')
  return true
}

function priced(product) {
  return Number.isFinite(product?.tradeExVat)
}

function bestEquipmentProducts(products, manufacturer, equipment, water) {
  if (!manufacturer || !equipment) return []
  const matches = products.filter((product) =>
    product.applicationBrand === manufacturer &&
    (product.equipment || []).includes(equipment) &&
    materialMatches(product, water)
  )
  const kits = matches.filter((product) => product.kind === 'Engine anode kit')
  return kits.length ? kits : matches
}

export default function MyBoat({ products, onViewProduct, onAddProduct }) {
  const [savedBoat, setSavedBoat] = useState(() => loadBoat())
  const [editing, setEditing] = useState(() => !loadBoat())
  const [name, setName] = useState(() => loadBoat()?.name || '')
  const [driveBrand, setDriveBrand] = useState(() => loadBoat()?.driveBrand || 'Volvo Penta')
  const [drive, setDrive] = useState(() => loadBoat()?.drive || '')
  const [thruster, setThruster] = useState(() => loadBoat()?.thruster || '')
  const [water, setWater] = useState(() => loadBoat()?.water || 'Salt')

  const driveBrands = useMemo(() =>
    [...new Set(products.filter((p) => p.applicationBrand !== 'Sleipner').map((p) => p.applicationBrand))].sort(),
  [products])

  const driveOptions = useMemo(() =>
    [...new Set(products.filter((p) => p.applicationBrand === driveBrand).flatMap((p) => p.equipment || []))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  [products, driveBrand])

  const thrusterOptions = useMemo(() =>
    [...new Set(products.filter((p) => p.applicationBrand === 'Sleipner').flatMap((p) => p.equipment || []))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  [products])

  useEffect(() => {
    if (drive && !driveOptions.includes(drive)) setDrive('')
  }, [driveBrand, drive, driveOptions])

  const recommendations = useMemo(() => {
    if (!savedBoat) return []
    const driveProducts = bestEquipmentProducts(products, savedBoat.driveBrand, savedBoat.drive, savedBoat.water)
    const thrusterProducts = savedBoat.thruster
      ? bestEquipmentProducts(products, 'Sleipner', savedBoat.thruster, savedBoat.water)
      : []
    const seen = new Set()
    return [...driveProducts, ...thrusterProducts].filter((product) => {
      if (seen.has(product.sku)) return false
      seen.add(product.sku)
      return true
    })
  }, [products, savedBoat])

  function saveBoat() {
    if (!name.trim() || !drive) return
    const boat = { name: name.trim(), driveBrand, drive, thruster, water }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boat))
    setSavedBoat(boat)
    setEditing(false)
  }

  function editBoat() {
    if (savedBoat) {
      setName(savedBoat.name)
      setDriveBrand(savedBoat.driveBrand)
      setDrive(savedBoat.drive)
      setThruster(savedBoat.thruster || '')
      setWater(savedBoat.water)
    }
    setEditing(true)
  }

  function forgetBoat() {
    localStorage.removeItem(STORAGE_KEY)
    setSavedBoat(null)
    setName('')
    setDrive('')
    setThruster('')
    setWater('Salt')
    setEditing(true)
  }

  const pricedTotal = recommendations.filter(priced).reduce((sum, product) => sum + retailPriceIncVat(product.tradeExVat), 0)
  const pendingCount = recommendations.filter((product) => !priced(product)).length

  return (
    <section className="myboat" id="my-boat">
      <div className="myboat-head">
        <div>
          <div className="eyebrow">My Boat · no account required</div>
          <h2>{savedBoat && !editing ? savedBoat.name : 'Build your boat profile'}</h2>
          <p>Save equipment on this device and turn catalogue compatibility into a reusable annual anode shortlist.</p>
        </div>
        {savedBoat && !editing && <div className="myboat-actions"><button onClick={editBoat}>Edit boat</button><button className="text-danger" onClick={forgetBoat}>Forget</button></div>}
      </div>

      {editing ? (
        <div className="boat-form">
          <label><span>Boat name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sea Breeze" /></label>
          <label><span>Drive manufacturer</span><select value={driveBrand} onChange={(e) => setDriveBrand(e.target.value)}>{driveBrands.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Drive / propulsion</span><select value={drive} onChange={(e) => setDrive(e.target.value)}><option value="">Choose equipment…</option>{driveOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Thruster (optional)</span><select value={thruster} onChange={(e) => setThruster(e.target.value)}><option value="">None / not listed</option>{thrusterOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Operating water</span><select value={water} onChange={(e) => setWater(e.target.value)}><option>Salt</option><option>Brackish</option><option>Fresh</option></select></label>
          <div className="boat-form-actions"><button className="primary" disabled={!name.trim() || !drive} onClick={saveBoat}>Save this boat on this device</button>{savedBoat && <button className="secondary" onClick={() => setEditing(false)}>Cancel</button>}</div>
          <div className="local-note">Demo storage only: this profile stays in this browser using localStorage. A future account would sync the same vessel record across devices.</div>
        </div>
      ) : (
        <>
          <div className="boat-summary">
            <div><span>Drive</span><strong>{savedBoat.driveBrand} · {savedBoat.drive}</strong></div>
            <div><span>Thruster</span><strong>{savedBoat.thruster || 'Not saved'}</strong></div>
            <div><span>Water</span><strong>{savedBoat.water}</strong></div>
          </div>

          <div className="annual-head"><div><strong>Annual anode shortlist</strong><span>Compatibility matches from the verified demo catalogue.</span></div>{recommendations.length > 0 && <div><strong>{pricedTotal > 0 ? money(pricedTotal) : '—'}</strong><span>{pendingCount ? `${pendingCount} price${pendingCount === 1 ? '' : 's'} pending` : 'priced items inc VAT'}</span></div>}</div>

          {recommendations.length > 0 ? <div className="annual-list">{recommendations.map((product) => <article key={product.sku}><div><span className="annual-system">{product.applicationBrand === 'Sleipner' ? 'Thruster' : 'Drive'}</span><strong>{product.use}</strong><span>Tecnoseal {product.sku} · {product.material}</span></div><div className="annual-price"><strong>{priced(product) ? money(retailPriceIncVat(product.tradeExVat)) : 'Price pending'}</strong><button onClick={() => onViewProduct(product)}>View</button>{priced(product) && <button className="add-small" onClick={() => onAddProduct(product)}>Add</button>}</div></article>)}</div> : <div className="boat-empty">No verified {savedBoat.water.toLowerCase()}-water records are currently loaded for this equipment combination. The boat profile is still saved.</div>}

          <div className="annual-disclaimer">This is a compatibility shortlist, not yet a guaranteed complete service schedule. Production My Boat will only call a set “complete” when every fitted system and required quantity has been explicitly mapped.</div>
        </>
      )}
    </section>
  )
}
