import { useCallback, useState } from 'react'
import { returnApi } from '../../api/returnApi.js'
import { productApi } from '../../api/productApi.js'
import { purchaseOrderApi } from '../../api/purchaseOrderApi.js'
import { salesOrderApi } from '../../api/salesOrderApi.js'
import { useResource } from '../../hooks/useResource.js'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import '../../styles/returns.css'

export default function PurchaseReturnsPage({ business, purchase = true }) {
  const load = useCallback(
    () => Promise.all([returnApi.list({ type: purchase ? 'purchase' : 'sale' }), productApi.list(), purchase ? purchaseOrderApi.list() : salesOrderApi.list()]),
    [purchase],
  )
  const { data, loading, error, refetch, setData } = useResource(load, [purchase], [[], [], []])
  const [returns, products, orders] = data
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      type: purchase ? 'purchase' : 'sale',
      orderId: formData.get('orderId'),
      productId: formData.get('productId'),
      quantity: Number(formData.get('quantity')),
      reason: formData.get('reason'),
      refundAmount: Number(formData.get('refundAmount') || 0),
    }
    if (!payload.orderId || !payload.productId || !payload.quantity) {
      setMessage({ type: 'error', text: 'Select a valid order, product, and return quantity.' })
      return
    }
    setSaving(true)
    try {
      const record = await returnApi.create(payload)
      const [freshReturns, freshProducts] = await Promise.all([returnApi.list({ type: payload.type }), productApi.list()])
      setData((current) => [freshReturns, freshProducts, current[2]])
      setMessage({ type: 'success', text: `${record.returnId} completed and inventory updated.` })
      form.reset()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not process the return.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="returns-page">
      <div className="products-toolbar">
        <div>
          <p className="dashboard-kicker">Purchases / Purchase Returns</p>
          <h2>Purchase Returns</h2>
          <p className="products-count">Complete returns for {business.name}</p>
        </div>
        <span className="business-filter">{returns.length} completed</span>
      </div>
      {message && <p className={`form-status ${message.type}`}>{message.text}</p>}
      <form className="return-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="return-order">Order *</label>
          <select id="return-order" name="orderId" defaultValue="" required>
            <option value="" disabled>Select order</option>
            {orders.map((order) => (
              <option key={order.orderId || order.purchaseOrderId} value={order.orderId || order.purchaseOrderId}>
                {order.orderNumber} · {purchase ? order.supplierName : order.customerName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="return-product">Product *</label>
          <select id="return-product" name="productId" defaultValue="" required>
            <option value="" disabled>Select product</option>
            {products.map((product) => (
              <option key={product.productId} value={product.productId}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="return-quantity">Quantity *</label>
          <input id="return-quantity" name="quantity" type="number" min="1" required />
        </div>
        <div>
          <label htmlFor="return-reason">Reason</label>
          <select id="return-reason" name="reason">
            <option>Damaged product</option>
            <option>Defective product</option>
            <option>Incorrect product</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="return-refund">Refund / credit amount</label>
          <input id="return-refund" name="refundAmount" type="number" min="0" step="0.01" defaultValue="0" />
        </div>
        <button className="submit-button" type="submit" disabled={saving}>
          {saving ? 'Processing…' : 'Complete return'} <span>→</span>
        </button>
      </form>
      <AsyncBoundary loading={loading} error={error} onRetry={refetch} isEmpty={!returns.length} emptyText="No returns recorded for this business yet.">
        <div className="history-list">
          {returns.map((item) => (
            <div className="history-row" key={item.returnId}>
              <span className="history-type adjustment">{item.type} return</span>
              <span>
                <strong>{item.returnId} · {item.productName}</strong>
                <small>{item.quantity} units · {item.reason} · {new Date(item.createdAt).toLocaleString()}</small>
              </span>
              <span className="history-quantity">Completed</span>
            </div>
          ))}
        </div>
      </AsyncBoundary>
    </section>
  )
}
