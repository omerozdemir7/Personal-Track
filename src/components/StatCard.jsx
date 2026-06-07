function StatCard({ icon: Icon, label, value, hint, tone = 'primary' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">
        <Icon size={20} strokeWidth={2.1} />
      </div>
      <div className="stat-card__body">
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  )
}

export default StatCard
