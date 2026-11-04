import { useCallback, useState, useMemo } from 'react'
import {
  RotateCcw,
  Truck,
  DollarSign,
  PackageCheck,
  Search,
  Plus,
  Package,
} from 'lucide-react'
import { StatCard } from '../../dashboard/components/common/StatCard.tsx'
import { Badge } from '../../dashboard/components/common/Badge.tsx'
import { TableSkeleton } from '../../components/ui/Feedback.tsx'
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

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredReturns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return returns;
    return returns.filter(
      (r) =>
        (r.returnId || '').toLowerCase().includes(q) ||
        (r.productName || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
    );
  }, [returns, search]);

  const totalPages = Math.ceil(filteredReturns.length / pageSize) || 1;
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage, pageSize]);

  const totalUnitsReturned = returns.reduce((sum, r) => sum + Number(r.quantity || 0), 0)
  const totalRefund = returns.reduce((sum, r) => sum + Number(r.refundAmount || 0), 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Purchase Returns
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Complete supplier returns and manage outbound inventory adjustments for {business.name || 'your business'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 py-0.5">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('return-order');
              if (el) {
                el.focus();
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Plus size={16} />
            <span>+ New Return</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border ${
            message.type === 'error'
              ? 'bg-[#FDECEC] text-[#D64545] border-[#F9C2C2]'
              : 'bg-[#E8F5EC] text-[#2E8B57] border-[#CDEBD5]'
          }`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}

      {/* 4 Dashboard-style StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<RotateCcw size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
          label="Total PO Returns"
          value={returns.length}
          trend="Processed supplier returns"
          isPositive={true}
        />
        <StatCard
          icon={<Truck size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
          label="Units Dispatched"
          value={`${totalUnitsReturned} units`}
          trend="Returned to vendor"
          isPositive={true}
        />
        <StatCard
          icon={<DollarSign size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E8F5EC] text-[#2E8B57]"
          label="Supplier Credit"
          value={`${business.currency || 'INR'} ${totalRefund.toFixed(2)}`}
          trend="Credit notes & refunds"
          isPositive={true}
        />
        <StatCard
          icon={<PackageCheck size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Eligible Orders"
          value={`${orders.length} orders`}
          trend="Available for return"
          isPositive={true}
        />
      </div>

      {/* Initiate Return Form Card */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#1C1B18]">Initiate Purchase Return</h2>
          <p className="text-xs text-[#6B665E] mt-0.5">Select purchase order and product to record an outbound return</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label htmlFor="return-order" className="block text-xs font-semibold text-[#1C1B18] mb-1">
                Purchase Order *
              </label>
              <select
                id="return-order"
                name="orderId"
                defaultValue=""
                required
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#7FAE82]"
              >
                <option value="" disabled>Select order</option>
                {orders.map((order) => {
                  const id = order.orderId || order.purchaseOrderId || order._id;
                  return (
                    <option key={id} value={id}>
                      {order.orderNumber} · {order.supplierName || 'Supplier'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="return-product" className="block text-xs font-semibold text-[#1C1B18] mb-1">
                Product to Return *
              </label>
              <select
                id="return-product"
                name="productId"
                defaultValue=""
                required
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#7FAE82]"
              >
                <option value="" disabled>Select product</option>
                {products.map((product) => (
                  <option key={product.productId || product._id} value={product.productId || product._id}>
                    {product.name} ({product.sku || 'No SKU'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="return-quantity" className="block text-xs font-semibold text-[#1C1B18] mb-1">
                Return Quantity *
              </label>
              <input
                id="return-quantity"
                name="quantity"
                type="number"
                min="1"
                required
                placeholder="Units"
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
              />
            </div>

            <div>
              <label htmlFor="return-reason" className="block text-xs font-semibold text-[#1C1B18] mb-1">
                Return Reason
              </label>
              <select
                id="return-reason"
                name="reason"
                defaultValue="Damaged product"
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#7FAE82]"
              >
                <option value="Damaged product">Damaged product</option>
                <option value="Defective product">Defective product</option>
                <option value="Incorrect product">Incorrect product</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="return-refund" className="block text-xs font-semibold text-[#1C1B18] mb-1">
                Refund / Credit Amount
              </label>
              <input
                id="return-refund"
                name="refundAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              <RotateCcw size={15} />
              <span>{saving ? 'Processing…' : 'Complete Return'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Table Section matching Products Page */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl p-3 border border-[#EEE6DA] flex items-center justify-between gap-3 shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9A948A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by return ID, product, or reason..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
            />
          </div>
        </div>

        {loading && returns.length === 0 ? (
          <TableSkeleton
            columns={[
              { title: 'Return ID', width: '15%' },
              { title: 'Product', width: '25%' },
              { title: 'Quantity & Reason', width: '25%' },
              { title: 'Credit / Refund', width: '15%', align: 'right' },
              { title: 'Status', width: '10%', align: 'center' },
              { title: 'Date', width: '10%', align: 'center' },
            ]}
            rows={6}
          />
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] p-12 text-center shadow-2xs">
            <Package className="mx-auto text-[#9A948A] mb-3 opacity-60" size={36} />
            <h3 className="text-sm font-semibold text-[#1C1B18]">No returns found</h3>
            <p className="text-xs text-[#6B665E] mt-1 max-w-sm mx-auto">
              {returns.length ? 'No returns match your search.' : 'No purchase returns recorded for this business yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium">Return ID</th>
                    <th className="py-3 px-3 font-medium">Product</th>
                    <th className="py-3 px-3 font-medium">Quantity & Reason</th>
                    <th className="py-3 px-3 font-medium text-right">Credit / Refund</th>
                    <th className="py-3 px-3 font-medium text-center">Status</th>
                    <th className="py-3 px-4 text-center font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6DA]/80">
                  {paginatedReturns.map((item) => (
                    <tr key={item.returnId || Math.random()} className="hover:bg-[#FAF6EF]/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#1C1B18] text-[13px]">
                        #{item.returnId || 'RET-ITEM'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1C1B18] text-[13px]">{item.productName || 'Unknown Product'}</div>
                        <div className="text-[11px] text-[#9A948A]">{item.productSku || 'No SKU'}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1C1B18] text-xs">{item.quantity} units</div>
                        <div className="text-[11px] text-[#6B665E]">{item.reason || 'Not specified'}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                        {business.currency || 'INR'} {Number(item.refundAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="success">Completed</Badge>
                      </td>
                      <td className="py-3 px-4 text-center text-[#6B665E] whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-[#EEE6DA] flex items-center justify-between text-xs text-[#6B665E]">
                <span>
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredReturns.length)} to{' '}
                  {Math.min(currentPage * pageSize, filteredReturns.length)} of {filteredReturns.length} returns
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-medium text-[#1C1B18]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
