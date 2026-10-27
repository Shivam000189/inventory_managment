import { Icon } from './icons.jsx'
import './Toolbar.css'

export function Toolbar({
  children,
  search = null,
  onSearchChange = null,
  searchPlaceholder = 'Search...',
  searchLabel = 'Search list',
  actions = null,
  className = '',
  ...props
}) {
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
              value={search ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchLabel}
            />
          </div>
        )}
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
