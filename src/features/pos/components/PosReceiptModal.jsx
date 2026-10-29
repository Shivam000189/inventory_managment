import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const invoiceStyles = `
/* Shared by the bill preview, printed bill, and standalone download. */
.pos-bill-preview {
  z-index: 2000;
  padding: 18px clamp(10px, 3vw, 30px) 30px;
  overscroll-behavior: contain;
  outline: none;
}
.pos-bill-preview .invoice-actions {
  position: sticky;
  top: 0;
  left: auto;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  max-width: 850px;
  margin: 0 auto 16px;
  padding: 12px;
  border: 1px solid var(--sr-border, #cec9c5);
  border-radius: var(--sr-radius, 8px);
  color: var(--sr-text, #27231e);
  background: var(--sr-surface, #fff);
  transform: none;
}
.invoice-ready { flex: 1 1 180px; min-width: 0; }
.invoice-ready strong, .invoice-ready span { display: block; overflow-wrap: anywhere; }
.invoice-ready strong { font-size: 16px; }
.invoice-ready span { color: var(--sr-text-soft, #605b55); font-size: 13px; }
.pos-bill-preview .invoice-actions button {
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
}
.pos-bill-preview .invoice-actions button:focus-visible { outline: 2px solid var(--orange, #e86c3e); outline-offset: 3px; }
article.invoice-sheet.invoice-document {
  box-sizing: border-box;
  max-width: 850px;
  margin: auto;
  padding: clamp(18px, 4vw, 38px);
  color: #312c25;
  background: #fff;
  font: 14px/1.6 Arial, sans-serif;
  overflow-wrap: anywhere;
}
.invoice-document .invoice-brand, .invoice-document .invoice-meta, .invoice-document .invoice-total-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.invoice-document .invoice-brand h2 { margin: 0 0 8px; color: #312c25; font-size: 24px; }
.invoice-document .invoice-brand p, .invoice-document .invoice-meta p { color: #615b53; font-size: 14px; line-height: 1.6; }
.invoice-document .invoice-brand > div:last-child, .invoice-document .invoice-meta > p:last-child { text-align: right; }
.invoice-document .invoice-table { display: table; width: 100%; margin: 22px 0; border-collapse: collapse; font-size: 13px; }
.invoice-document .invoice-table th, .invoice-document .invoice-table td { padding: 10px 7px; border-bottom: 1px solid #e2dfdc; text-align: left; }
.invoice-document .invoice-table th { color: #615b53; font: 12px Arial, sans-serif; text-transform: uppercase; }
.invoice-document .invoice-table small { color: #615b53; font-size: 12px; }
.invoice-item-variant { display: block; }
.invoice-document .invoice-totals { width: min(100%, 340px); margin-left: auto; }
.invoice-document .invoice-total-row { padding: 5px 0; font-size: 14px; }
.invoice-document .invoice-total-row.grand { margin-top: 6px; padding-top: 12px; border-top: 2px solid #423c34; font-size: 18px; font-weight: bold; }
.invoice-document .invoice-total-row.due { color: #973b23; }
.invoice-document .invoice-payments { display: grid; gap: 6px; margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2dfdc; font-size: 14px; }
.invoice-document footer { margin-top: 28px; color: #615b53; text-align: center; font-size: 13px; }
@media screen and (max-width: 600px) {
  .invoice-ready { flex-basis: 100%; }
  .pos-bill-preview .invoice-actions button { flex: 1 1 auto; }
  .invoice-document .invoice-brand, .invoice-document .invoice-meta { display: block; }
  .invoice-document .invoice-brand > div:last-child, .invoice-document .invoice-meta > p:last-child { text-align: left; }
  .invoice-document .invoice-table { display: block; overflow-x: auto; }
  .invoice-document .invoice-table th, .invoice-document .invoice-table td { min-width: 60px; }
}
@media print {
  body.pos-printing { height: auto !important; overflow: visible !important; background: #fff !important; }
  body.pos-printing > :not(.pos-bill-preview) { display: none !important; }
  body.pos-printing .pos-bill-preview {
    display: block !important;
    position: static !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }
  .pos-bill-preview .invoice-actions { display: none !important; }
  body.pos-printing .invoice-document, article.invoice-sheet.invoice-document {
    position: static !important;
    width: 100%;
    max-width: none;
    padding: 8mm;
    color: #000 !important;
    background: #fff !important;
    box-shadow: none;
  }
  .invoice-document .invoice-table { display: table !important; overflow: visible; }
  .invoice-document thead { display: table-header-group; }
  .invoice-document tr, .invoice-document .invoice-totals, .invoice-document .invoice-payments { break-inside: avoid; }
}
`;

const money = (currency, value) =>
  `${currency} ${Number(value || 0).toFixed(2)}`;

export default function PosReceiptModal({ invoice, onClose }) {
  const sheetRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousTitle = document.title;
    const beforePrint = () => document.body.classList.add("pos-printing");
    const afterPrint = () => document.body.classList.remove("pos-printing");
    document.body.style.overflow = "hidden";
    document.title = `Bill ${invoice.invoiceNumber}`;
    dialogRef.current?.focus();
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      afterPrint();
      document.body.style.overflow = previousOverflow;
      document.title = previousTitle;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [invoice.invoiceNumber]);

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    if (event.key === "Tab") {
      const buttons = dialogRef.current.querySelectorAll("button:not(:disabled)");
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && [first, dialogRef.current].includes(document.activeElement)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  const download = () => {
    if (!sheetRef.current) return;
    const copy = document.implementation.createHTMLDocument(`Bill ${invoice.invoiceNumber}`);
    const charset = copy.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    const viewport = copy.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1";
    const style = copy.createElement("style");
    style.textContent = invoiceStyles;
    copy.head.prepend(charset, viewport, style);
    copy.body.append(copy.importNode(sheetRef.current, true));
    const blob = new Blob([`<!doctype html>${copy.documentElement.outerHTML}`], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.html`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const print = () => {
    document.body.classList.add("pos-printing");
    window.print();
  };

  return createPortal(
    <div
      ref={dialogRef}
      className="invoice-overlay pos-bill-preview"
      role="dialog"
      aria-modal="true"
      aria-label={`Bill ${invoice.invoiceNumber}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <style>{invoiceStyles}</style>
      <div className="invoice-actions">
        <div className="invoice-ready">
          <strong>Bill ready</strong>
          <span>{invoice.invoiceNumber} · {invoice.paymentStatus}</span>
        </div>
        <button type="button" onClick={print}>
          Print / Save PDF
        </button>
        <button type="button" onClick={download}>
          Download bill
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <article className="invoice-sheet invoice-document" ref={sheetRef}>
        <div className="invoice-brand">
          <div>
            <h2>{invoice.business.name}</h2>
            <p>
              {invoice.business.address}
              <br />
              {invoice.business.city}, {invoice.business.state}
              <br />
              GSTIN: {invoice.business.gstin || "Not provided"}
            </p>
          </div>
          <div>
            <strong>BILL / INVOICE</strong>
            <p>
              {invoice.invoiceNumber}
              <br />
              {new Date(invoice.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="invoice-meta">
          <p>
            <strong>Bill to</strong>
            <br />
            {invoice.customerName}
            <br />
            {invoice.customerPhone || "Walk-in customer"}
            <br />
            {invoice.customerGstin ? `GSTIN: ${invoice.customerGstin}` : "Unregistered"}
          </p>
          <p>
            <strong>Place of supply</strong>
            <br />
            {invoice.placeOfSupply || invoice.business.state}
          </p>
        </div>
        <table className="invoice-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>GST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item) => (
              <tr key={item.id || item.productId || item.sku || item.productName}>
                <td>
                  <strong>{item.productName || item.name}</strong>
                  <br />
                  <small>{item.sku}</small>
                </td>
                <td>{item.hsn || "—"}</td>
                <td>{item.quantity}</td>
                <td>{money(invoice.business.currency, item.unitPrice)}</td>
                <td>{item.gstRate || 0}%</td>
                <td>{money(invoice.business.currency, item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-totals">
          <div className="invoice-total-row">
            <span>Subtotal</span>
            <span>{money(invoice.business.currency, invoice.subtotal)}</span>
          </div>
          <div className="invoice-total-row">
            <span>Discounts</span>
            <span>
              -{" "}
              {money(
                invoice.business.currency,
                Number(invoice.discount || 0) + Number(invoice.offerDiscount || 0),
              )}
            </span>
          </div>
          {invoice.cgst > 0 && (
            <>
              <div className="invoice-total-row">
                <span>CGST</span>
                <span>{money(invoice.business.currency, invoice.cgst)}</span>
              </div>
              <div className="invoice-total-row">
                <span>SGST</span>
                <span>{money(invoice.business.currency, invoice.sgst)}</span>
              </div>
            </>
          )}
          {invoice.igst > 0 && (
            <div className="invoice-total-row">
              <span>IGST</span>
              <span>{money(invoice.business.currency, invoice.igst)}</span>
            </div>
          )}
          <div className="invoice-total-row">
            <span>Round off</span>
            <span>{money(invoice.business.currency, invoice.roundOff)}</span>
          </div>
          <div className="invoice-total-row grand">
            <span>Total</span>
            <span>{money(invoice.business.currency, invoice.totalAmount)}</span>
          </div>
          <div className="invoice-total-row">
            <span>Paid</span>
            <span>{money(invoice.business.currency, invoice.amountPaid)}</span>
          </div>
          <div className="invoice-total-row due">
            <span>Balance due</span>
            <span>{money(invoice.business.currency, invoice.balanceDue)}</span>
          </div>
        </div>
        <div className="invoice-payments">
          <strong>Payments</strong>
          {(invoice.paymentSummary || []).map((payment) => (
            <span key={payment.id || payment.method || payment.reference}>
              {payment.method}:{" "}
              {money(invoice.business.currency, payment.amount)}{" "}
              {["Credit", "Pay Later"].includes(payment.method) && "(not collected) "}
              {payment.reference && `(${payment.reference})`}
            </span>
          ))}
        </div>
        <footer>Thank you for your business.</footer>
      </article>
    </div>,
    document.body,
  );
}
