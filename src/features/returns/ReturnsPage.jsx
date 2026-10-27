import SalesReturnsPage from './SalesReturnsPage.jsx'
import PurchaseReturnsPage from './PurchaseReturnsPage.jsx'

export default function ReturnsPage(props) {
  return props.purchase ? <PurchaseReturnsPage {...props} /> : <SalesReturnsPage {...props} />
}
