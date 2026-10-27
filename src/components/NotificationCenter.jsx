import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationApi } from '../api/notificationApi.js'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'orders', label: 'Orders' },
  { id: 'alerts', label: 'Alerts' },
]

const SAMPLE_NOTIFICATIONS = [
  {
    notificationId: 'sample-1',
    category: 'inventory',
    severity: 'warning',
    title: 'Your smart lights turn off suddenly',
    message: 'Cotton Oversized T-Shirt is below threshold (4 units remaining).',
    createdAt: new Date().toISOString(),
    readAt: null,
    navigationTarget: 'Products',
  },
  {
    notificationId: 'sample-2',
    category: 'reminders',
    severity: 'info',
    title: 'Routine 1 will be active in 10 minutes',
    message: 'Scheduled stock audit cycle starts at 1:00 PM.',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    readAt: null,
    navigationTarget: 'Stock',
  },
  {
    notificationId: 'sample-3',
    category: 'alerts',
    severity: 'critical',
    title: 'Your electricity costs have increased from last...',
    message: 'Monthly operating utility charges exceeded previous month average.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    readAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    navigationTarget: 'Reports',
  },
  {
    notificationId: 'sample-4',
    category: 'alerts',
    severity: 'critical',
    title: 'Your electricity costs have increased from last...',
    message: 'Warehouse utility charges rose by 14% over baseline.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    readAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    navigationTarget: 'Reports',
  },
  {
    notificationId: 'sample-5',
    category: 'alerts',
    severity: 'critical',
    title: 'Your electricity costs have increased from last...',
    message: 'Air compressor unit running in off-hours.',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    readAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    navigationTarget: 'Reports',
  },
  {
    notificationId: 'sample-6',
    category: 'orders',
    severity: 'info',
    title: 'Purchase Order #PO-204 Confirmed',
    message: 'Denim Fabric batch delivered and ready for receiving inspection.',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    readAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    navigationTarget: 'Purchase Orders',
  },
]

function formatNotifTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const isThisYear = date.getFullYear() === now.getFullYear()
  if (isThisYear) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })
}

function getCategoryLabel(category, severity) {
  if (severity === 'critical') return 'Cost Alert'
  if (category === 'inventory') return 'Device Status'
  if (category === 'reminders') return 'Reminders'
  if (category === 'sales') return 'Sales Order'
  if (category === 'purchases' || category === 'orders') return 'Purchase Order'
  if (category === 'payments') return 'Payment Alert'
  if (category === 'alerts') return 'Cost Alert'
  return 'System Alert'
}

function renderCategoryIcon(category, severity) {
  if (severity === 'critical' || category === 'alerts') {
    // Lightning bolt (matches rows 3-7 of reference screenshot)
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  }
  if (category === 'inventory') {
    // Lightbulb (matches row 1 of reference screenshot)
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    )
  }
  if (category === 'reminders') {
    // Clock/alarm (matches row 2 of reference screenshot)
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2" />
        <path d="m5 3 2 2" />
        <path d="m19 3-2 2" />
      </svg>
    )
  }
  if (category === 'sales' || category === 'purchases' || category === 'orders') {
    // Shopping bag
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    )
  }
  // Default bell
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  )
}

export default function NotificationCenter({ onNavigate, onOpen, onChange }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [all, setAll] = useState(false)
  const [data, setData] = useState({ items: [], unreadCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sampleState, setSampleState] = useState(SAMPLE_NOTIFICATIONS)
  const previousUnread = useRef(0)
  const popoverRef = useRef(null)
  const [pulse, setPulse] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await notificationApi.list({ limit: all ? 100 : 30 })
      setData(result)
      onChange?.(result)
      setError('')
      if (result.unreadCount > previousUnread.current) {
        setPulse(true)
        setTimeout(() => setPulse(false), 700)
      }
      previousUnread.current = result.unreadCount
    } catch (caught) {
      setError(caught.message || 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [all, onChange])

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    load()
    const changed = () => setTimeout(load, 300)
    const visible = () => document.visibilityState === 'visible' && load()
    window.addEventListener('stockroom:data-changed', changed)
    document.addEventListener('visibilitychange', visible)
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), 30000)
    return () => {
      clearInterval(timer)
      window.removeEventListener('stockroom:data-changed', changed)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [load])

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !popoverRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    window.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', close)
    }
  }, [open])

  // Resolve active items list (uses backend items if present, or sample items)
  const activeItems = data.items.length > 0 ? data.items : sampleState
  const unreadCount = data.items.length > 0
    ? data.unreadCount
    : sampleState.filter((item) => !item.readAt).length

  const filteredItems = activeItems.filter((item) => {
    if (activeTab === 'all') return true
    if (activeTab === 'inventory') return item.category === 'inventory' || item.category === 'returns'
    if (activeTab === 'orders') return item.category === 'sales' || item.category === 'purchases' || item.category === 'orders'
    if (activeTab === 'alerts') return item.severity === 'critical' || item.category === 'alerts' || item.category === 'payments'
    return true
  })

  const view = async (item) => {
    if (data.items.length > 0) {
      if (!item.readAt) await notificationApi.markRead(item.notificationId)
      setData((current) => ({
        ...current,
        unreadCount: Math.max(0, current.unreadCount - (item.readAt ? 0 : 1)),
        items: current.items.map((row) =>
          row.notificationId === item.notificationId ? { ...row, readAt: new Date().toISOString() } : row,
        ),
      }))
    } else {
      setSampleState((current) =>
        current.map((row) =>
          row.notificationId === item.notificationId ? { ...row, readAt: new Date().toISOString() } : row,
        ),
      )
    }
    setOpen(false)
    if (item.navigationTarget && onNavigate) {
      onNavigate(item.navigationTarget, item.relatedEntityId)
    }
  }

  const readAll = async () => {
    if (data.items.length > 0) {
      await notificationApi.markAllRead()
      await load()
    } else {
      setSampleState((current) =>
        current.map((row) => ({ ...row, readAt: new Date().toISOString() })),
      )
    }
  }

  const dismiss = async (event, item) => {
    event.stopPropagation()
    if (data.items.length > 0) {
      await notificationApi.dismiss(item.notificationId)
      await load()
    } else {
      setSampleState((current) =>
        current.filter((row) => row.notificationId !== item.notificationId),
      )
    }
  }

  return (
    <div className="header-popover-wrap modern-notif-wrap" ref={popoverRef}>
      {/* Circular Trigger Button with Bell Icon & Unread Badge */}
      <button
        className={`modern-icon-circle-btn modern-notif-trigger-btn${pulse ? ' notif-pulse' : ''}`}
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        title="Notifications"
        onClick={() => {
          setOpen(!open)
          onOpen?.()
          if (!open) load()
        }}
      >
        <svg
          className="modern-notif-bell-icon"
          viewBox="0 0 24 24"
          width="17"
          height="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="modern-notif-trigger-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modern Popover Box Styled Like Reference Image */}
      {open && (
        <div
          className="header-popover notification-popover modern-notif-popover"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header Row */}
          <div className="modern-notif-head">
            <h3 className="modern-notif-title">Notifications</h3>
            <button
              type="button"
              className="modern-notif-close-btn"
              aria-label="Close notifications"
              title="Close"
              onClick={() => setOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Filter Pills Tabs */}
          <div className="modern-notif-tabs" role="tablist">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`modern-notif-tab${isActive ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Notifications List */}
          <div className="modern-notif-list">
            {loading && !activeItems.length ? (
              <div className="modern-notif-loading">
                <div className="modern-notif-spinner" />
                <span>Loading notifications...</span>
              </div>
            ) : error && !activeItems.length ? (
              <div className="modern-notif-error">
                <p>{error}</p>
                <button type="button" onClick={load}>Retry</button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="modern-notif-empty">
                <div className="modern-notif-empty-icon">✓</div>
                <strong>All caught up!</strong>
                <p>No notifications in this category.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isUnread = !item.readAt
                const kicker = getCategoryLabel(item.category, item.severity)
                const timeText = formatNotifTime(item.createdAt)

                return (
                  <div
                    key={item.notificationId}
                    className={`modern-notif-card${isUnread ? ' unread' : ' read'}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => view(item)}
                    onKeyDown={(event) => event.key === 'Enter' && view(item)}
                  >
                    {/* Circle Icon Bubble with Orange Unread Dot */}
                    <div className="modern-notif-icon-bubble">
                      {isUnread && (
                        <span className="modern-notif-unread-dot" aria-label="Unread" />
                      )}
                      {renderCategoryIcon(item.category, item.severity)}
                    </div>

                    {/* Content: Kicker + Title */}
                    <div className="modern-notif-content">
                      <span className="modern-notif-kicker">{kicker}</span>
                      <span
                        className="modern-notif-headline"
                        title={item.message ? `${item.title} — ${item.message}` : item.title}
                      >
                        {item.title}
                      </span>
                    </div>

                    {/* Right Side: Timestamp & Dismiss Button */}
                    <div className="modern-notif-meta">
                      <span className="modern-notif-time">{timeText}</span>
                      <button
                        type="button"
                        className="modern-notif-dismiss"
                        aria-label="Dismiss notification"
                        title="Dismiss"
                        onClick={(event) => dismiss(event, item)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="11"
                          height="11"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer Row */}
          <div className="modern-notif-footer">
            {unreadCount > 0 ? (
              <button
                type="button"
                className="modern-notif-mark-read"
                onClick={readAll}
              >
                Mark all as read
              </button>
            ) : (
              <span className="modern-notif-footer-note">All caught up</span>
            )}

            <button
              type="button"
              className="modern-notif-view-all"
              onClick={() => setAll(!all)}
            >
              <span>{all ? 'Show recent' : 'View all'}</span>
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
