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
          onClick={() => navigateTo('Orders')}
        >
          View all
        </button>
      </div>
      <div className="modern-activity-list">
        {displayActivities.map((item) => {
          const handleClick = () => {
            if (item.navTo) {
              if (openNotification) openNotification(item.navTo)
              else navigateTo(item.navTo)
            }
          }

          return (
            <button
              type="button"
              className={`modern-activity-row activity-${item.statusClass || 'status-completed'}`}
              key={item.id}
              onClick={handleClick}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                padding: '12px 14px',
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
            </button>
          )
        })}
      </div>
    </div>
  )
}
