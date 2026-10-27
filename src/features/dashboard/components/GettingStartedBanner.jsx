export default function GettingStartedBanner({
  account,
  checklistDismissed,
  setChecklistDismissed,
  gettingStarted,
  products = [],
  capabilities,
  navigateTo,
  business,
}) {
  if (account?.role !== "owner" || checklistDismissed || !gettingStarted) {
    return null;
  }

  return (
    <section className="getting-started" style={{ marginBottom: 0 }}>
      <header>
        <div>
          <p className="dashboard-kicker">Getting started</p>
          <h2>Finish setting up at your pace</h2>
        </div>
        <button
          type="button"
          className="close-button"
          aria-label="Dismiss getting started"
          onClick={() => {
            localStorage.setItem(
              `stockroom-getting-started:${business?.businessId}`,
              "dismissed"
            );
            setChecklistDismissed(true);
          }}
        >
          ×
        </button>
      </header>
      <div>
        {[
          [products.length > 0, "Add first product", capabilities?.productLabel || "Products"],
          [gettingStarted.suppliers > 0, "Add supplier", "Suppliers"],
          [
            products.some(
              (product) =>
                Number(product.minimumStock) > 0 ||
                product.variants?.some((variant) => variant.reorderPoint > 0)
            ),
            "Configure stock/reorder settings",
            capabilities?.productLabel || "Products",
          ],
          [gettingStarted.sales, "Make first sale", "POS / Billing"],
          [gettingStarted.members > 1, "Invite team member", "Users"],
        ].map(([done, label, destination]) => (
          <button type="button" key={label} onClick={() => navigateTo(destination)}>
            <span className={done ? "done" : ""}>{done ? "✓" : "○"}</span>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
