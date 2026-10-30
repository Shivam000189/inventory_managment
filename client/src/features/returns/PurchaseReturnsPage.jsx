import { useCallback, useState } from 'react'
import { returnApi } from '../../api/returnApi.js'
import { productApi } from '../../api/productApi.js'
import { purchaseOrderApi } from '../../api/purchaseOrderApi.js'
import { salesOrderApi } from '../../api/salesOrderApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import { Icon } from '../../components/ui/icons.jsx'
import './ReturnsPage.css'

export default function PurchaseReturnsPage({ business = {}, purchase = true }) {
  const load = useCallback(
    () =>
      Promise.all([
        returnApi.list({ type: purchase ? 'purchase' : 'sale' }),
        productApi.list(),
        purchase ? purchaseOrderApi.list() : salesOrderApi.list(),
      ]),
    [purchase]
  )
  const { data, loading, error, refetch, setData } = useResource(load, [purchase], [[], [], []])
  const [returns = [], products = [], orders = []] = data
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
      const [freshReturns, freshProducts] = await Promise.all([
        returnApi.list({ type: payload.type }),
        productApi.list(),
      ])
      setData((current) => [freshReturns, freshProducts, current[2]])
      setMessage({ type: 'success', text: `${record.returnId || 'Return'} completed and inventory updated.` })
      form.reset()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not process the return.' })
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'returnId',
      header: 'Id',
      render: (item) => (
        <span className="ledger-cell-id">
          #{item.returnId || 'RET-ITEM'}
        </span>
      ),
      mobileLabel: 'Return ID',
    },
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <div>
          <span className="ledger-cell-primary">{item.productName || 'Unknown Product'}</span>
          <span className="ledger-cell-secondary">{item.productSku || 'No SKU'}</span>
        </div>
      ),
      mobileLabel: 'Product',
    },
    {
      key: 'quantity',
      header: 'Quantity & Reason',
      render: (item) => (
        <div>
          <span className="ledger-cell-primary">{item.quantity} units</span>
          <span className="ledger-cell-secondary">{item.reason || 'Not specified'}</span>
        </div>
      ),
      mobileLabel: 'Qty & Reason',
    },
    {
      key: 'refundAmount',
      header: 'Credit / Refund',
      render: (item) => (
        <span className="ledger-cell-cost">
          {business.currency || 'INR'} {Number(item.refundAmount || 0).toFixed(2)}
        </span>
      ),
      mobileLabel: 'Refund',
    },
    {
      key: 'status',
      header: 'Status',
      render: (_item) => (
        <span className="ledger-status-pill" style={{ backgroundColor: '#10b981' }}>
          Completed
        </span>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (item) => (
        <span className="ledger-cell-secondary">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
        </span>
      ),
      mobileLabel: 'Date',
    },
  ]

  const totalUnitsReturned = returns.reduce((sum, r) => sum + Number(r.quantity || 0), 0)
  const totalRefund = returns.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0)

  return (
    <div className="returns-page returns-container">
      <PageHeader
        kicker="Purchases / Returns"
        title="Purchase Returns"
        badge={`${returns.length} completed`}
        description={`Complete supplier returns and manage outbound inventory adjustments for ${business.name || 'your business'}.`}
      />

      {message && (
        <div className={`return-alert-box ${message.type === 'error' ? 'return-alert-error' : 'return-alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* 4 Pastel KPI Summary Cards */}
      <div className="ledger-kpi-grid">
        <div className="ledger-kpi-card blue">
          <div className="ledger-kpi-icon-bubble">
            <Icon name="return" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Total PO Returns</span>
            <span className="ledger-kpi-value">{returns.length}</span>
            <span className="ledger-kpi-subtext">Processed supplier returns</span>
          </div>
        </div>

        <div className="ledger-kpi-card slate">
          <div className="ledger-kpi-icon-bubble">
            <Icon name="truck" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Units Dispatched</span>
            <span className="ledger-kpi-value">{totalUnitsReturned} units</span>
            <span className="ledger-kpi-subtext">Returned to vendor</span>
          </div>
        </div>

        <div className="ledger-kpi-card green">
          <div className="ledger-kpi-icon-bubble">
            <Icon name="dollar" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Supplier Credit</span>
            <span className="ledger-kpi-value">
              {business.currency || 'INR'} {totalRefund.toFixed(2)}
            </span>
            <span className="ledger-kpi-subtext">Credit notes & refunds</span>
          </div>
        </div>

        <div className="ledger-kpi-card amber">
          <div className="ledger-kpi-icon-bubble">
            <Icon name="pending" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Eligible Orders</span>
            <span className="ledger-kpi-value">{orders.length} orders</span>
            <span className="ledger-kpi-subtext">Available for return</span>
          </div>
        </div>
      </div>

      <Card title="Initiate Purchase Return" subtitle="Select purchase order and product to record an outbound return">
        <form className="purchase-return-form" onSubmit={handleSubmit}>
          <div className="returns-form-grid">
            <Field label="Purchase Order" required htmlFor="return-order">
              <Select id="return-order" name="orderId" defaultValue="" required>
                <option value="" disabled>Select order</option>
                {orders.map((order) => {
                  const id = order.orderId || order.purchaseOrderId || order._id
                  return (
                    <option key={id} value={id}>
                      {order.orderNumber} · {order.supplierName || 'Supplier'}
                    </option>
                  )
                })}
              </Select>
            </Field>

            <Field label="Product to Return" required htmlFor="return-product">
              <Select id="return-product" name="productId" defaultValue="" required>
                <option value="" disabled>Select product</option>
                {products.map((product) => (
                  <option key={product.productId || product._id} value={product.productId || product._id}>
                    {product.name} ({product.sku || 'No SKU'})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Return Quantity" required htmlFor="return-quantity">
              <Input id="return-quantity" name="quantity" type="number" min="1" required placeholder="Units" />
            </Field>

            <Field label="Return Reason" htmlFor="return-reason">
              <Select id="return-reason" name="reason" defaultValue="Damaged product">
                <option value="Damaged product">Damaged product</option>
                <option value="Defective product">Defective product</option>
                <option value="Incorrect product">Incorrect product</option>
                <option value="Other">Other</option>
              </Select>
            </Field>

            <Field label="Refund / Credit Amount" htmlFor="return-refund">
              <Input
                id="return-refund"
                name="refundAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                placeholder="0.00"
              />
            </Field>
          </div>

          <div className="returns-form-actions">
            <Button variant="primary" type="submit" loading={saving} disabled={saving} icon="arrow-path">
              {saving ? 'Processing…' : 'Complete Return'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Purchase Returns History" subtitle="Audit log of all completed supplier returns">
        <DataTable
          columns={columns}
          data={returns}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No returns recorded"
          emptyDescription="No purchase returns recorded for this business yet."
        />
      </Card>
    </div>
  )
}
