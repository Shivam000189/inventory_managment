import React, { type ReactNode } from 'react'
import './Tabs.css'

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number | string;
  [key: string]: unknown;
}

export interface TabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  onChange: (tabId: string) => void;
  className?: string;
  'aria-label'?: string;
}

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Navigation tabs',
}: TabsProps) {
  return (
    <nav className={`ui-tabs ${className}`} aria-label={ariaLabel}>
      <div className="ui-tabs-list" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`ui-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ui-tab-count">{tab.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
export default Tabs
