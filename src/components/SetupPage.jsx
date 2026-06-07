import { Settings } from 'lucide-react'

function SetupPage({ configurationIssues }) {
  return (
    <div className="setup-shell">
      <section className="setup-card">
        <div className="setup-card__icon">
          <Settings size={32} />
        </div>
        <span className="eyebrow">Kurulum Gerekli</span>
        <h1>Firebase ayarlarını tamamlayın</h1>
        <p>
          Uygulama gerçek Firebase veritabanı ile çalışır. Proje kökünde bir{' '}
          <code>.env</code> dosyası oluşturup aşağıdaki değişkenleri doldurun.
        </p>

        <div className="setup-grid">
          <article className="setup-panel">
            <strong>Eksik ayarlar</strong>
            <ul>
              {configurationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </article>

          <article className="setup-panel">
            <strong>.env dosyası örneği</strong>
            <code className="code-block">
              VITE_FIREBASE_API_KEY=...
              {'\n'}
              VITE_FIREBASE_AUTH_DOMAIN=...
              {'\n'}
              VITE_FIREBASE_PROJECT_ID=...
              {'\n'}
              VITE_FIREBASE_STORAGE_BUCKET=...
              {'\n'}
              VITE_FIREBASE_MESSAGING_SENDER_ID=...
              {'\n'}
              VITE_FIREBASE_APP_ID=...
            </code>
          </article>
        </div>
      </section>
    </div>
  )
}

export default SetupPage
