export default function ActivityFeed({
  displayActivities,
  navigateTo,
  openNotification,
}) {
  return (
    <div className="modern-panel-card">
      <div className="modern-activity-header">
        <h3>📅 Recent Activity</h3>
        <button
          type="button"
          className="modern-view-all-btn"
          onClick={() => navigateTo("Orders")}
        >
          View all
        </button>
      </div>
      <div className="modern-activity-list">
        {displayActivities.map((item) => (
          <div
            className={`modern-activity-row activity-${item.statusClass || "status-completed"}`}
            key={item.id}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (item.navTo) {
                if (openNotification) openNotification(item.navTo);
                else navigateTo(item.navTo);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && item.navTo) {
                if (openNotification) openNotification(item.navTo);
                else navigateTo(item.navTo);
              }
            }}
          >
            <div className="modern-activity-time">
              <strong>{item.time}</strong>
              <small>{item.sub}</small>
            </div>
            <div className="modern-activity-details">
              <strong className="modern-activity-name">{item.title}</strong>
              <small>{item.details}</small>
            </div>
            <span className={`modern-status-badge ${item.statusClass}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
