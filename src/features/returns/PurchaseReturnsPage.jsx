import { useCallback, useState } from 'react'
import { returnApi } from '../../api/returnApi.js'
import { productApi } from '../../api/productApi.js'
import { purchaseOrderApi } from '../../api/purchaseOrderApi.js'
import { salesOrderApi } from '../../api/salesOrderApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard, Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
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
      header: 'Return ID',
      render: (item) => (
        <div>
          <span className="font-semibold text-main">{item.returnId || 'RET-ITEM'}</span>
          <small className="block text-muted">{item.type} return</small>
        </div>
      ),
      mobileLabel: 'Return ID',
    },
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <div>
          <span className="font-medium text-main">{item.productName || 'Unknown Product'}</span>
          <small className="block text-muted">{item.productSku || 'No SKU'}</small>
        </div>
      ),
      mobileLabel: 'Product',
    },
    {
      key: 'quantity',
      header: 'Quantity & Reason',
      render: (item) => (
        <div>
          <span className="text-main">{item.quantity} units</span>
          <small className="block text-muted">{item.reason || 'Not specified'}</small>
        </div>
      ),
      mobileLabel: 'Qty & Reason',
    },
    {
      key: 'status',
      header: 'Status',
      render: (_item) => <Badge tone="success">Completed</Badge>,
      mobileLabel: 'Status',
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (item) => (
        <span className="text-soft text-sm">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
        </span>
      ),
      mobileLabel: 'Date',
    },
  ]

  const totalUnitsReturned = returns.reduce((sum, r) => sum + Number(r.quantity || 0), 0)

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

      <StatGrid columns={3}>
        <StatCard
          title="Total Returns"
          value={returns.length}
          subtext="Processed purchase returns"
          icon="arrow-path"
        />
        <StatCard
          title="Units Returned"
          value={`${totalUnitsReturned} units`}
          subtext="Returned to supplier"
          deltaType="neutral"
          icon="box"
        />
        <StatCard
          title="Active Suppliers"
          value={orders.length}
          subtext="Eligible orders available"
          icon="truck"
        />
      </StatGrid>

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
