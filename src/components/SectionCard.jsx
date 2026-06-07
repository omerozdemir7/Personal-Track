function SectionCard({ eyebrow, title, description, actions, children, className = '' }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <header className="section-card__header">
        <div>
          {eyebrow ? <span className="section-card__eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="section-card__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}

export default SectionCard
