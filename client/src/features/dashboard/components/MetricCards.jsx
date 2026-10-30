import { StatGrid, StatCard } from '../../../components/ui/Card.jsx'
import { Icon } from '../../../components/ui/icons.jsx'

export default function MetricCards({
  totalProductsCount,
  unitsInStock,
  todaySalesVal,
  pendingOrdersVal,
  activeCustomersVal,
  business,
  capabilities,
  navigateTo,
}) {
  const currency = business?.currency || 'INR'
  const productLabel = capabilities?.productLabel || 'Products'

  return (
    <StatGrid>
      {/* Card 1: Total Products */}
      <StatCard
        title="Total Products"
        value={Number(totalProductsCount || 0).toLocaleString()}
        subtitle={unitsInStock > 0 ? `${Number(unitsInStock).toLocaleString()} units in stock` : 'Catalog inventory'}
        icon={<Icon name="box" size={22} />}
        tone="blue"
        onClick={() => navigateTo(productLabel)}
        aria-label={`View ${productLabel} catalog`}
      />

      {/* Card 2: Today's Sales */}
      <StatCard
        title="Today's Sales"
        value={`${currency} ${Number(todaySalesVal || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        subtitle="POS & register revenue"
        icon={<Icon name="trending-up" size={22} />}
        tone="green"
        onClick={() => navigateTo('POS / Billing')}
        aria-label="Open POS / Billing"
      />

      {/* Card 3: Pending Orders */}
      <StatCard
        title="Pending Orders"
        value={Number(pendingOrdersVal || 0).toLocaleString()}
        subtitle="Awaiting fulfillment"
        icon={<Icon name="clock" size={22} />}
        tone="yellow"
        onClick={() => navigateTo('Orders')}
        aria-label="View pending orders"
      />

      {/* Card 4: Total Customers */}
      <StatCard
        title="Total Customers"
        value={Number(activeCustomersVal || 0).toLocaleString()}
        subtitle="Active directory"
        icon={<Icon name="users" size={22} />}
        tone="purple"
        onClick={() => navigateTo('Customers')}
        aria-label="View customers directory"
      />
    </StatGrid>
  )
}
