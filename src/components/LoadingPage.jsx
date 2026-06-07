function LoadingPage() {
  return (
    <div className="loader-shell">
      <section className="loader-card">
        <div className="loader-spinner" aria-hidden="true" />
        <span className="eyebrow">Yükleniyor</span>
        <h1>Oturum doğrulanıyor</h1>
        <p>Firebase bağlantısı kontrol ediliyor, lütfen bekleyin.</p>
      </section>
    </div>
  )
}

export default LoadingPage
