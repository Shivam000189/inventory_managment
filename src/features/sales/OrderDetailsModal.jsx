import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'

export default function OrderDetails({ order, business, onClose }) {
  const dialog = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.showModal?.()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previous?.focus()
    }
  }, [onClose])

  const currency = business?.currency || 'INR'
  const money = (value) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const initials = (value) =>
    String(value || 'Customer')
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()

  const print = () => {
    document.body.classList.add('printing-sales-order')
    const cleanup = () => {
      document.body.classList.remove('printing-sales-order')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
  }

  const statusTone =
    order.status === 'Completed'
      ? 'success'
      : order.status === 'Cancelled'
        ? 'danger'
        : 'warning'

  return createPortal(
    <dialog
      className="order-receipt-dialog"
      ref={dialog}
      aria-labelledby="receipt-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
    >
      <div className="receipt-body">
        <header className="receipt-header">
          <div className="receipt-eyebrow">
            <span>Sales Order Details</span>
            <Badge tone="primary" size="sm">
              {order.billingType === 'wholesale' ? 'Wholesale' : 'Retail'} {order.channel === 'POS' ? 'POS' : 'Order'}
            </Badge>
          </div>
          <button
            type="button"
            className="receipt-close"
            aria-label="Close order details"
            onClick={onClose}
          >
            ×
          </button>
          <div className="receipt-title">
            <h2 id="receipt-title">{order.orderNumber}</h2>
            <button
              type="button"
              className="receipt-copy-btn"
              aria-label="Copy order number"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(order.orderNumber)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? '✓ Copied' : '⧉ Copy'}
            </button>
          </div>
          <p>
            {new Date(order.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </header>

        <div className="receipt-parties">
          <div>
            <span className="receipt-section-label">Customer</span>
            <div className="receipt-customer">
              <span className="receipt-avatar">{initials(order.customerName)}</span>
              <div>
                <strong>{order.customerName || 'Walk-in customer'}</strong>
                <small>
                  {order.channel === 'POS' ? 'Counter checkout' : 'Sales desk'} ·{' '}
                  {order.billingType === 'wholesale' ? 'Wholesale' : 'Retail'}
                </small>
              </div>
            </div>
          </div>
          <div>
            <span className="receipt-section-label">Status</span>
            <div className="receipt-status-wrap">
              <Badge tone={statusTone} dot>
                {order.status} · {order.paymentStatus || 'Unpaid'}
              </Badge>
              {order.paymentSummary?.map((payment) => (
                <small key={payment.id || payment.reference || payment.method}>
                  Payment: {payment.method}
                  {payment.reference ? ` · Ref: ${payment.reference}` : ''}
                </small>
              ))}
            </div>
          </div>
        </div>

        <section className="receipt-items">
          <h3 className="receipt-section-label">
            Purchased Items ({order.items?.length || 0})
          </h3>
          <div className="receipt-items-list">
            {(order.items || []).map((item, index) => (
              <div className="receipt-item" key={item.id || item.productId || `item-${index}`}>
                <span className="receipt-product-icon">
                  {initials(item.productName || item.name)}
                </span>
                <div className="receipt-item-info">
                  <strong>
                    {item.productName || item.name || 'Product'} × {item.quantity}
                  </strong>
                  <small>
                    {[
                      item.variantSku && `SKU: ${item.variantSku}`,
                      item.variantColor,
                      item.variantSize,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </div>
                <div className="receipt-item-price">
                  <strong>{money(item.total || Number(item.quantity || 1) * Number(item.sellingPrice || item.unitPrice || 0))}</strong>
                  <small>{money(item.sellingPrice || item.unitPrice)} / unit</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="receipt-totals">
          <dl className="receipt-dl">
            {order.subtotal !== undefined && (
              <div>
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
            )}
            {Number(order.discount) > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{money(order.discount)}</dd>
              </div>
            )}
            {Number(order.offerDiscount) > 0 && (
              <div>
                <dt>Offer discount</dt>
                <dd>−{money(order.offerDiscount)}</dd>
              </div>
            )}
            {Number(order.tax) > 0 && (
              <div>
                <dt>Tax</dt>
                <dd>{money(order.tax)}</dd>
              </div>
            )}
            {order.roundOff !== undefined && Number(order.roundOff) !== 0 && (
              <div>
                <dt>Round off</dt>
                <dd>{money(order.roundOff)}</dd>
              </div>
            )}
          </dl>
          <div className="receipt-grand-total">
            <span className="receipt-section-label">Total Amount</span>
            <strong>{money(order.totalAmount)}</strong>
          </div>
        </div>

        {order.notes && <p className="receipt-notes">{order.notes}</p>}

        <footer className="receipt-footer">
          <p>
            {order.cashierName ? (
              <>
                Cashier: <strong>{order.cashierName}</strong>
              </>
            ) : (
              business?.name || 'Stockroom'
            )}
          </p>
          <div className="receipt-actions">
            <Button variant="secondary" size="sm" onClick={print}>
              Print / Save PDF
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </footer>
      </div>
    </dialog>,
    document.body
  )
}
