import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import invoiceStyles from "../pos-invoice.css?inline";

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
