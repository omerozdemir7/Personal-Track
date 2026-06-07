import {
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'
import { departmentOptions, shiftOptions } from '../data/options'
import StatusPill from './StatusPill'

const createLoginDraft = () => ({
  email: '',
  password: '',
})

const createRegisterDraft = () => ({
  fullName: '',
  email: '',
  password: '',
  department: departmentOptions[0],
  jobTitle: '',
  phone: '',
  location: 'İstanbul',
  shift: shiftOptions[1],
})

function LoginPage({
  configurationIssues = [],
  requiresSetup = false,
  sessionMessage,
  sessionStatus,
  busyAction,
  notice,
  onSignIn,
  onSignUp,
}) {
  const [loginRole, setLoginRole] = useState('personnel')
  const [showRegister, setShowRegister] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginDraft, setLoginDraft] = useState(createLoginDraft())
  const [registerDraft, setRegisterDraft] = useState(createRegisterDraft())

  const handleSignIn = async (event) => {
    event.preventDefault()
    const success = await onSignIn({ ...loginDraft, expectedRole: loginRole })
    if (success) {
      setLoginDraft(createLoginDraft())
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault()
    const success = await onSignUp(registerDraft)
    if (success) {
      setRegisterDraft(createRegisterDraft())
      setShowRegister(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__bg" aria-hidden="true">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
        <div className="login-page__orb login-page__orb--3" />
      </div>

      <div className="login-page__container">
        

        <section className="login-card">
          <header className="login-card__header">
            <h2>{showRegister ? 'Yeni Hesap Oluştur' : 'Giriş Yap'}</h2>
            <p>
              {showRegister
                ? 'Personel veya yönetici hesabı kaydedin.'
                : 'Hesap türünüzü seçin ve bilgilerinizle giriş yapın.'}
            </p>
          </header>

          {requiresSetup ? (
            <div className="notice-banner notice-banner--warning setup-notice">
              <strong>Firebase henüz yapılandırılmadı.</strong>
              <p>Proje kökünde <code>.env</code> dosyası oluşturun. Giriş, ayarlar tamamlanınca çalışır.</p>
              <ul>
                {configurationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!showRegister ? (
            <>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-selector__btn ${loginRole === 'personnel' ? 'role-selector__btn--active' : ''}`}
                  onClick={() => setLoginRole('personnel')}
                >
                  <UsersRound size={22} />
                  <div>
                    <strong>Personel Girişi</strong>
                    <span>Profil, izin ve duyurular</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`role-selector__btn ${loginRole === 'admin' ? 'role-selector__btn--active' : ''}`}
                  onClick={() => setLoginRole('admin')}
                >
                  <ShieldCheck size={22} />
                  <div>
                    <strong>Yönetici Girişi</strong>
                    <span>Tüm operasyon paneli</span>
                  </div>
                </button>
              </div>

              {sessionStatus === 'error' ? (
                <div className="notice-banner notice-banner--error">{sessionMessage}</div>
              ) : null}

              {notice?.type === 'error' ? (
                <div className="notice-banner notice-banner--error">{notice.message}</div>
              ) : null}

              <form className="auth-form" onSubmit={handleSignIn}>
                <label>
                  E-posta adresi
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="ornek@sirket.com"
                    value={loginDraft.email}
                    onChange={(event) =>
                      setLoginDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Şifre
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength="6"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginDraft.password}
                      onChange={(event) =>
                        setLoginDraft((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <button
                  className="login-submit-btn"
                  type="submit"
                  disabled={busyAction === 'sign-in'}
                >
                  {loginRole === 'admin' ? <ShieldCheck size={20} /> : <UserCheck size={20} />}
                  <span>
                    {busyAction === 'sign-in'
                      ? 'Giriş yapılıyor...'
                      : loginRole === 'admin'
                        ? 'Yönetici Girişi Yap'
                        : 'Personel Girişi Yap'}
                  </span>
                </button>
              </form>

              <footer className="login-card__footer">
                <p>Henüz hesabınız yok mu?</p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowRegister(true)}
                >
                  Hesap oluştur
                </button>
              </footer>
            </>
          ) : (
            <>
              {notice?.type === 'error' ? (
                <div className="notice-banner notice-banner--error">{notice.message}</div>
              ) : null}

              <form className="auth-form" onSubmit={handleSignUp}>
                <div className="input-grid">
                  <label>
                    Ad Soyad
                    <input
                      required
                      placeholder="Ad Soyad"
                      value={registerDraft.fullName}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    E-posta
                    <input
                      type="email"
                      required
                      placeholder="ornek@sirket.com"
                      value={registerDraft.email}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="input-grid">
                  <label>
                    Şifre
                    <input
                      type="password"
                      required
                      minLength="6"
                      placeholder="En az 6 karakter"
                      value={registerDraft.password}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    Departman
                    <select
                      value={registerDraft.department}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          department: event.target.value,
                        }))
                      }
                    >
                      {departmentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="input-grid">
                  <label>
                    Görev Unvanı
                    <input
                      required
                      placeholder="Örn. Yazılım Uzmanı"
                      value={registerDraft.jobTitle}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          jobTitle: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    Vardiya
                    <select
                      value={registerDraft.shift}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          shift: event.target.value,
                        }))
                      }
                    >
                      {shiftOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="input-grid">
                  <label>
                    Telefon
                    <input
                      placeholder="05xx xxx xx xx"
                      value={registerDraft.phone}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    Lokasyon
                    <input
                      value={registerDraft.location}
                      onChange={(event) =>
                        setRegisterDraft((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className="role-preview">
                  <StatusPill value="personnel" />
                  <p>
                    Tüm yeni kayıtlar <strong>personel</strong> olarak açılır. Yönetici
                    yetkisi için Firebase Console → Firestore → <strong>users</strong>{' '}
                    koleksiyonunda ilgili kullanıcının <strong>accountRole</strong> alanını{' '}
                    <code>admin</code> yapın.
                  </p>
                </div>

                <button
                  className="login-submit-btn"
                  type="submit"
                  disabled={busyAction === 'sign-up'}
                >
                  <UserPlus size={20} />
                  <span>
                    {busyAction === 'sign-up' ? 'Hesap hazırlanıyor...' : 'Hesabı Oluştur'}
                  </span>
                </button>
              </form>

              <footer className="login-card__footer">
                <p>Zaten hesabınız var mı?</p>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowRegister(false)}
                >
                  Giriş sayfasına dön
                </button>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default LoginPage
