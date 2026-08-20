import { useEffect, useMemo, useState } from 'react'
import { retailPriceIncVat, money } from './data/products.js'

const STORAGE_KEY = 'anodefinder.myboat.v1'
const HISTORY_KEY = 'anodefinder.myboat.service.v1'

function loadJson(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    return saved ?? fallback
  } catch {
    return fallback
  }
}

function loadBoat() {
  const saved = loadJson(STORAGE_KEY, null)
  return saved && typeof saved === 'object' ? saved : null
}

function loadHistory() {
  const saved = loadJson(HISTORY_KEY, [])
  return Array.isArray(saved) ? saved : []
}

function todayIso() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function addMonths(dateString, months) {
  if (!months) return null
  const date = new Date(`${dateString}T12:00:00`)
  date.setMonth(date.getMonth() + Number(months))
  return date.toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
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
  const [addedAll, setAddedAll] = useState(false)
  const [history, setHistory] = useState(() => loadHistory())
  const [recordingService, setRecordingService] = useState(false)
  const [serviceDate, setServiceDate] = useState(() => todayIso())
  const [reminderMonths, setReminderMonths] = useState('12')
  const [serviceNote, setServiceNote] = useState('')
  const [serviceItems, setServiceItems] = useState({})

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

  const recommendationGroups = useMemo(() => {
    if (!savedBoat) return []
    const groups = [{
      key: 'drive',
      label: 'Drive',
      equipment: `${savedBoat.driveBrand} · ${savedBoat.drive}`,
      products: bestEquipmentProducts(products, savedBoat.driveBrand, savedBoat.drive, savedBoat.water),
    }]

    if (savedBoat.thruster) {
      groups.push({
        key: 'thruster',
        label: 'Thruster',
        equipment: `Sleipner · ${savedBoat.thruster}`,
        products: bestEquipmentProducts(products, 'Sleipner', savedBoat.thruster, savedBoat.water),
      })
    }
    return groups
  }, [products, savedBoat])

  const recommendations = useMemo(() => {
    const seen = new Set()
    return recommendationGroups.flatMap((group) =>
      group.products.map((product) => ({ product, system: group.label }))
    ).filter(({ product }) => {
      if (seen.has(product.sku)) return false
      seen.add(product.sku)
      return true
    })
  }, [recommendationGroups])

  useEffect(() => {
    if (!recordingService) return
    setServiceItems((current) => {
      const next = {}
      recommendations.forEach(({ product }) => {
        next[product.sku] = current[product.sku] || { selected: true, qty: 1 }
      })
      return next
    })
  }, [recordingService, recommendations])

  const boatHistory = useMemo(() => {
    if (!savedBoat) return []
    return history.filter((entry) => entry.boatName === savedBoat.name).sort((a, b) => b.date.localeCompare(a.date))
  }, [history, savedBoat])

  function saveBoat() {
    if (!name.trim() || !drive) return
    const boat = { name: name.trim(), driveBrand, drive, thruster, water }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boat))
    setSavedBoat(boat)
    setEditing(false)
    setAddedAll(false)
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
    setAddedAll(false)
  }

  function forgetBoat() {
    if (savedBoat) {
      const remainingHistory = history.filter((entry) => entry.boatName !== savedBoat.name)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(remainingHistory))
      setHistory(remainingHistory)
    }
    localStorage.removeItem(STORAGE_KEY)
    setSavedBoat(null)
    setName('')
    setDrive('')
    setThruster('')
    setWater('Salt')
    setEditing(true)
    setAddedAll(false)
  }

  function addAllPriced() {
    const purchasable = recommendations.map(({ product }) => product).filter(priced)
    if (!purchasable.length) return
    purchasable.forEach((product) => onAddProduct(product))
    setAddedAll(true)
  }

  function toggleServiceItem(sku) {
    setServiceItems((items) => ({
      ...items,
      [sku]: { ...(items[sku] || { qty: 1 }), selected: !(items[sku]?.selected ?? true) },
    }))
  }

  function setServiceQty(sku, qty) {
    const safeQty = Math.max(1, Math.min(20, Number(qty) || 1))
    setServiceItems((items) => ({
      ...items,
      [sku]: { ...(items[sku] || { selected: true }), qty: safeQty },
    }))
  }

  function recordService() {
    if (!savedBoat || !serviceDate || !recommendations.length) return
    const fittedItems = recommendations
      .filter(({ product }) => serviceItems[product.sku]?.selected)
      .map(({ product, system }) => ({
        sku: product.sku,
        system,
        qty: serviceItems[product.sku]?.qty || 1,
      }))
    if (!fittedItems.length) return

    const entry = {
      id: `${Date.now()}`,
      boatName: savedBoat.name,
      date: serviceDate,
      reminderMonths: Number(reminderMonths),
      reminderDate: addMonths(serviceDate, Number(reminderMonths)),
      note: serviceNote.trim(),
      equipment: {
        driveBrand: savedBoat.driveBrand,
        drive: savedBoat.drive,
        thruster: savedBoat.thruster,
        water: savedBoat.water,
      },
      items: fittedItems,
    }
    const next = [entry, ...history]
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    setHistory(next)
    setRecordingService(false)
    setServiceNote('')
    setServiceItems({})
  }

  function reorderEntry(entry) {
    entry.items.forEach((item) => {
      const product = products.find((candidate) => candidate.sku === item.sku)
      if (!product || !priced(product)) return
      const qty = Math.max(1, Number(item.qty) || 1)
      for (let i = 0; i < qty; i += 1) onAddProduct(product)
    })
  }

  const pricedProducts = recommendations.map(({ product }) => product).filter(priced)
  const pricedTotal = pricedProducts.reduce((sum, product) => sum + retailPriceIncVat(product.tradeExVat), 0)
  const pendingCount = recommendations.filter(({ product }) => !priced(product)).length
  const matchedSystems = recommendationGroups.filter((group) => group.products.length > 0).length
  const totalSystems = recommendationGroups.length
  const coverageComplete = totalSystems > 0 && matchedSystems === totalSystems
  const commercialComplete = recommendations.length > 0 && pendingCount === 0
  const lastService = boatHistory[0] || null
  const selectedServiceCount = recommendations.filter(({ product }) => serviceItems[product.sku]?.selected).length

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

          <div className="coverage-grid">
            <div className={coverageComplete ? 'coverage-ok' : 'coverage-warn'}><span>Compatibility coverage</span><strong>{matchedSystems}/{totalSystems} systems matched</strong><small>{coverageComplete ? 'Verified catalogue records found for every saved system.' : 'At least one saved system still needs catalogue mapping.'}</small></div>
            <div className={commercialComplete ? 'coverage-ok' : 'coverage-warn'}><span>Commercial coverage</span><strong>{commercialComplete ? 'Ready to price' : `${pendingCount} price${pendingCount === 1 ? '' : 's'} pending`}</strong><small>{commercialComplete ? 'Every shortlisted item has a trade cost loaded.' : 'Compatibility is retained even where supplier pricing is not yet loaded.'}</small></div>
          </div>

          <div className="service-status">
            <div><span>Last recorded replacement</span><strong>{lastService ? formatDate(lastService.date) : 'No service history yet'}</strong></div>
            <div><span>Next reminder</span><strong>{lastService?.reminderDate ? formatDate(lastService.reminderDate) : 'Not set'}</strong></div>
            <button onClick={() => setRecordingService((value) => !value)}>{recordingService ? 'Cancel' : 'Record replacement'}</button>
          </div>

          {recordingService && <div className="service-form">
            <div><strong>What was actually fitted?</strong><span>Select the parts changed during this service and record the fitted quantity. The service history will preserve exactly what was installed.</span></div>
            <div className="service-parts">
              {recommendations.map(({ product, system }) => {
                const item = serviceItems[product.sku] || { selected: true, qty: 1 }
                return <div className={`service-part ${item.selected ? 'selected' : ''}`} key={product.sku}>
                  <label className="service-check">
                    <input type="checkbox" checked={item.selected} onChange={() => toggleServiceItem(product.sku)} />
                    <span><small>{system}</small><strong>{product.use}</strong><em>Tecnoseal {product.sku} · {product.material}</em></span>
                  </label>
                  <label className="service-qty"><span>Qty fitted</span><input type="number" min="1" max="20" disabled={!item.selected} value={item.qty} onChange={(e) => setServiceQty(product.sku, e.target.value)} /></label>
                </div>
              })}
            </div>
            <label><span>Replacement date</span><input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></label>
            <label><span>Remind me in</span><select value={reminderMonths} onChange={(e) => setReminderMonths(e.target.value)}><option value="0">No reminder</option><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option><option value="18">18 months</option><option value="24">24 months</option></select></label>
            <label className="service-note"><span>Note (optional)</span><input value={serviceNote} onChange={(e) => setServiceNote(e.target.value)} placeholder="e.g. drive kit changed; thruster anode still serviceable" /></label>
            <button className="primary" disabled={!selectedServiceCount} onClick={recordService}>Save {selectedServiceCount} fitted item{selectedServiceCount === 1 ? '' : 's'}</button>
          </div>}

          <div className="annual-head"><div><strong>Annual anode shortlist</strong><span>Compatibility matches from the verified demo catalogue.</span></div>{recommendations.length > 0 && <div><strong>{pricedTotal > 0 ? money(pricedTotal) : '—'}</strong><span>{pendingCount ? `${pendingCount} price${pendingCount === 1 ? '' : 's'} pending` : 'priced items inc VAT'}</span></div>}</div>

          {recommendations.length > 0 ? <div className="annual-list">{recommendations.map(({ product, system }) => <article key={product.sku}><div><span className="annual-system">{system}</span><strong>{product.use}</strong><span>Tecnoseal {product.sku} · {product.material}</span></div><div className="annual-price"><strong>{priced(product) ? money(retailPriceIncVat(product.tradeExVat)) : 'Price pending'}</strong><button onClick={() => onViewProduct(product)}>View</button>{priced(product) && <button className="add-small" onClick={() => onAddProduct(product)}>Add</button>}</div></article>)}</div> : <div className="boat-empty">No verified {savedBoat.water.toLowerCase()}-water records are currently loaded for this equipment combination. The boat profile is still saved.</div>}

          {pricedProducts.length > 0 && <div className="annual-bulk"><div><strong>{pricedProducts.length} purchasable item{pricedProducts.length === 1 ? '' : 's'}</strong><span>{pendingCount ? `You can add the priced part of this shortlist now; ${pendingCount} record${pendingCount === 1 ? '' : 's'} remain price-pending.` : 'All shortlisted items have pricing loaded.'}</span></div><button className="primary" onClick={addAllPriced}>{addedAll ? 'Added to basket ✓' : `Add all priced · ${money(pricedTotal)}`}</button></div>}

          <div className="service-history">
            <div className="service-history-head"><div><strong>Service history</strong><span>{boatHistory.length ? `${boatHistory.length} replacement record${boatHistory.length === 1 ? '' : 's'} stored on this device.` : 'Record a replacement to start the vessel history.'}</span></div></div>
            {boatHistory.map((entry) => {
              const reorderable = entry.items.map((item) => {
                const product = products.find((candidate) => candidate.sku === item.sku)
                return product && priced(product) ? { product, qty: Math.max(1, Number(item.qty) || 1) } : null
              }).filter(Boolean)
              const reorderTotal = reorderable.reduce((sum, item) => sum + retailPriceIncVat(item.product.tradeExVat) * item.qty, 0)
              const totalQty = entry.items.reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0)
              return <article className="service-entry" key={entry.id}>
                <div><span>{formatDate(entry.date)}</span><strong>{totalQty} fitted anode{totalQty === 1 ? '' : 's'} across {entry.items.length} line{entry.items.length === 1 ? '' : 's'}</strong><small>{entry.items.map((item) => `${Math.max(1, Number(item.qty) || 1)}× ${item.sku}`).join(' · ')}</small>{entry.note && <small>{entry.note}</small>}</div>
                <div className="service-entry-actions"><span>{entry.reminderDate ? `Reminder ${formatDate(entry.reminderDate)}` : 'No reminder'}</span>{reorderable.length > 0 && <button onClick={() => reorderEntry(entry)}>Reorder exact fitted set · {money(reorderTotal)}</button>}</div>
              </article>
            })}
          </div>

          <div className="annual-disclaimer">This is a compatibility shortlist, not yet a guaranteed complete service schedule. Service history records only the items the customer says were actually fitted, with quantities, so future reorders can reproduce that set accurately.</div>
        </>
      )}
    </section>
  )
}
