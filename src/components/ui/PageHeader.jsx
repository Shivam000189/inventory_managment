import './PageHeader.css'

export function PageHeader({
  kicker = null,
  title,
  description = null,
  badge = null,
  actions = null,
  className = '',
  ...props
}) {
  return (
    <header className={`ui-page-header ${className}`} {...props}>
      <div className="ui-page-header-content">
        {kicker && <p className="ui-page-header-kicker">{kicker}</p>}
        <div className="ui-page-header-title-row">
          <h1 className="ui-page-header-title">{title}</h1>
          {badge}
        </div>
        {description && <p className="ui-page-header-desc">{description}</p>}
      </div>
      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </header>
  )
}
export default PageHeader
