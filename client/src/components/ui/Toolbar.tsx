import React, { type ReactNode, type HTMLAttributes } from 'react'
import { Icon } from './icons'
import './Toolbar.css'

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  filters?: ReactNode;
  search?: string | null;
  searchValue?: string | null;
  onSearchChange?: ((val: string) => void) | null;
  searchPlaceholder?: string;
  searchLabel?: string;
  actions?: ReactNode;
  className?: string;
  [key: string]: unknown;
}

export function Toolbar({
  children,
  filters = null,
  search = null,
  searchValue = null,
  onSearchChange = null,
  searchPlaceholder = 'Search...',
  searchLabel = 'Search list',
  actions = null,
  className = '',
  ...props
}: ToolbarProps) {
  const activeSearch = search ?? searchValue

  return (
    <div className={`ui-toolbar invoice-controls-row ${className}`} {...props}>
      <div className="ui-toolbar-left invoice-controls-left">
        {onSearchChange !== null && (
          <div className="ui-search-wrap invoice-search-wrap">
            <span className="ui-search-icon invoice-search-icon" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              className="ui-search-input invoice-search-input"
              value={activeSearch ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchLabel}
            />
          </div>
        )}
        {filters}
        {children}
      </div>
      {actions && (
        <div className="ui-toolbar-right invoice-controls-right">
          {actions}
        </div>
      )}
    </div>
  )
}

export const FilterBar = Toolbar
export default Toolbar
