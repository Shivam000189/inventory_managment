export default function PosPaymentSection({
  payments,
  setPayments,
  setPayment,
  createPaymentRow,
  METHODS,
  business,
  estimatedTotal,
  qrPaymentSelected,
  qr,
  qrAmount,
  saving,
  checkout,
  cartLength,
  money,
}) {
  return (
    <>
      <div className="pos-payments">
        <div className="pos-cart-head">
          <strong>Payment</strong>
          <button
            type="button"
            onClick={() =>
              setPayments([
                ...payments,
                createPaymentRow("UPI", 0, ""),
              ])
            }
          >
            + Split
          </button>
        </div>
        {payments.length === 1 && (
          <div className="pos-quick-methods">
            {[["Cash", "F8"], ["UPI", "F9"], ["Debit Card", "F10"]].map(([method, hint]) => (
              <button
                key={method}
                type="button"
                className={payments[0].method === method ? "active" : ""}
                onClick={() => setPayment(0, "method", method)}
              >
                {method === "Debit Card" ? "Card" : method}
                <small>{hint}</small>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPayments([...payments, createPaymentRow("UPI", 0, "")])}
            >
              Split
            </button>
          </div>
        )}
        {payments.map((payment, index) => (
          <div className="pos-payment-row" key={payment.id}>
            <select
              value={payment.method}
              onChange={(event) =>
                setPayment(index, "method", event.target.value)
              }
            >
              {METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={payment.amount}
              onChange={(event) =>
                setPayment(index, "amount", event.target.value)
              }
              placeholder="Amount"
            />
            <input
              value={payment.reference}
              onChange={(event) =>
                setPayment(index, "reference", event.target.value)
              }
              placeholder="Reference"
            />
            {payments.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPayments(payments.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          className="pay-full"
          type="button"
          onClick={() => setPayment(0, "amount", estimatedTotal)}
        >
          Set full amount
        </button>
        {qrPaymentSelected && !business.settings?.upiId && (
          <p className="pos-qr-notice">
            Add your Business UPI ID in Business → Settings, save it, then
            return here to display the payment QR.
          </p>
        )}
        {qr && (
          <div className="pos-qr">
            <img
              src={qr}
              alt={`UPI payment QR for ${money(business.currency, qrAmount)}`}
            />
            <small>Scan to pay {money(business.currency, qrAmount)}</small>
            <small>{business.settings.upiId}</small>
          </div>
        )}
      </div>

      <button
        className="submit-button pos-checkout-button"
        type="button"
        disabled={!cartLength || saving}
        onClick={checkout}
      >
        {saving
          ? "Saving sale & generating bill…"
          : `Complete sale & generate bill · ${money(business.currency, estimatedTotal)}`}{" "}
        <span>→</span>
      </button>
    </>
  );
}
