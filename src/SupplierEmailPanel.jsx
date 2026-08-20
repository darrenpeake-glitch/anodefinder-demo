import { useState } from 'react'

export default function SupplierEmailPanel({ supplierOrder, onMarkSent }) {
  const [copied, setCopied] = useState(false)
  const email = supplierOrder.email
  if (!email) return null

  const mailto = `mailto:${encodeURIComponent(email.to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`
  const sent = supplierOrder.status === 'SENT_TO_SUPPLIER'

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(`To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="supplier-email-panel">
      <div className="supplier-email-head">
        <div>
          <span>Email-first supplier adapter</span>
          <strong>{sent ? 'PO email marked as sent' : 'PO email ready to send'}</strong>
        </div>
        <span className={sent ? 'email-status sent' : 'email-status'}>{supplierOrder.status}</span>
      </div>

      <div className="email-meta">
        <div><span>To</span><strong>{email.to}</strong></div>
        <div><span>Subject</span><strong>{email.subject}</strong></div>
      </div>

      <pre className="email-preview">{email.body}</pre>

      <div className="email-actions">
        <a className="secondary-action" href={mailto}>Open email draft</a>
        <button className="secondary-action" onClick={copyEmail}>{copied ? 'Copied ✓' : 'Copy email'}</button>
        {!sent && <button className="primary-action" onClick={onMarkSent}>Mark email sent</button>}
      </div>

      <small className="email-demo-note">Demo only: GitHub Pages cannot send supplier email itself. Production will send this server-side after payment and record the provider message ID and timestamp.</small>
    </section>
  )
}
