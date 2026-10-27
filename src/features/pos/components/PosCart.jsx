export default function PosCart({
  cart,
  setCart,
  update,
  remove,
  canOverride,
  business,
  subtotal,
  lineDiscount,
  globalDiscount,
  offerDiscount,
  estimatedTax,
  estimatedTotal,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  activePaymentOffers,
  offerCode,
  setOfferCode,
  offerNotice,
  selectedOffer,
  couponCode,
  setCouponCode,
  customerMode,
  customerId,
  customers,
  loyaltyPointsRedeemed,
  setLoyaltyPointsRedeemed,
  money,
}) {
  return (
    <>
      <div className="pos-cart-head">
        <strong>Current cart</strong>
        <span>
          {cart.length} items · {cart.reduce((sum, item) => sum + item.quantity, 0)} units
        </span>
        {cart.length > 0 && (
          <button type="button" className="pos-clear-cart" onClick={() => setCart([])}>
            Clear cart
          </button>
        )}
      </div>

      <div className="pos-cart">
        {!cart.length ? (
          <div className="pos-empty">
            Scan or select a product to begin billing.
          </div>
        ) : (
          cart.map((item) => (
            <div className="pos-cart-row" key={item.cartKey}>
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.sku} · GST {item.gstRate}%
                </small>
              </div>
              <button type="button" onClick={() => remove(item.cartKey)}>
                ×
              </button>
              <label>
                Qty
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(event) =>
                    update(item.cartKey, "quantity", event.target.value)
                  }
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  disabled={!canOverride}
                  onChange={(event) =>
                    update(item.cartKey, "unitPrice", event.target.value)
                  }
                />
              </label>
              <label>
                Discount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discount}
                  onChange={(event) =>
                    update(item.cartKey, "discount", event.target.value)
                  }
                />
              </label>
              <b>
                {money(
                  business.currency,
                  item.quantity * item.unitPrice - item.discount,
                )}
              </b>
            </div>
          ))
        )}
      </div>

      <div className="pos-adjustments">
        <label>
          Bill discount
          <select
            value={discountType}
            onChange={(event) => setDiscountType(event.target.value)}
          >
            <option value="fixed">Fixed</option>
            <option value="percent">Percent</option>
          </select>
          <input
            type="number"
            min="0"
            value={discountValue}
            onChange={(event) =>
              setDiscountValue(Number(event.target.value))
            }
          />
        </label>
        <label>
          Payment offer
          <select
            value={offerCode}
            onChange={(event) => setOfferCode(event.target.value)}
            disabled={!activePaymentOffers.length}
            title={activePaymentOffers.length ? "Select a payment offer" : "No payment offers are configured"}
          >
            <option value="">No offer</option>
            {activePaymentOffers.map((offer) => (
              <option value={offer.code} key={offer.code}>
                {offer.label || offer.code}
              </option>
            ))}
          </select>
          {offerNotice && (
            <small className={selectedOffer ? "pos-offer-ok" : "pos-offer-hint"}>
              {offerNotice}
            </small>
          )}
        </label>
        <label>
          Coupon code
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="FASHION10"
          />
          {couponCode && <small>Validated when the sale completes</small>}
        </label>
        {customerMode === "existing" && customerId && (
          <label>
            Loyalty points
            <input
              type="number"
              min="0"
              max={customers.find((item) => item.customerId === customerId)?.loyaltyPoints || 0}
              value={loyaltyPointsRedeemed}
              onChange={(event) => setLoyaltyPointsRedeemed(Number(event.target.value))}
            />
            <small>
              Available: {customers.find((item) => item.customerId === customerId)?.loyaltyPoints || 0} points · Store credit: {money(business.currency, customers.find((item) => item.customerId === customerId)?.creditBalance || 0)}
            </small>
          </label>
        )}
      </div>

      <div className="pos-totals">
        <span>
          Subtotal <b>{money(business.currency, subtotal)}</b>
        </span>
        <span>
          Discount{" "}
          <b>
            -{" "}
            {money(
              business.currency,
              lineDiscount + globalDiscount + offerDiscount,
            )}
          </b>
        </span>
        <span>
          Estimated GST <b>{money(business.currency, estimatedTax)}</b>
        </span>
        <strong>
          Payable <b>{money(business.currency, estimatedTotal)}</b>
        </strong>
      </div>
    </>
  );
}
