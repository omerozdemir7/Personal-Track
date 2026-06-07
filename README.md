# PulseTrack HR

Firebase tabanlı, gerçek giriş sistemine sahip rol bazlı personel takip uygulaması. Sistem artık demo kullanmaz; `Email/Password` giriş ile çalışır ve yönetici ile personel ekranlarını ayrı ayrı sunar.

## Özellikler

- Firebase Authentication ile giriş ve hesap oluşturma
- Tek yönetici, çoklu personel yapısı
- Yönetici için personel kartı düzenleme, izin onaylama, duyuru yayınlama
- Personel için kendi profilini görüntüleme ve güncelleme
- Personel için kendi izin taleplerini oluşturma ve bekleyen talepleri silme
- Personel ve yönetici için yoklama kaydı
- Yönetici için JSON rapor çıktısı

## Teknolojiler

- React 19
- Vite
- Firebase Authentication
- Firebase Firestore
- Recharts
- Lucide React

## Kurulum

```bash
npm install
npm run dev
```

## Firebase Kurulumu

1. Firebase Console üzerinde yeni proje oluştur.
2. `Authentication` bölümünde `Email/Password` giriş yöntemini aktif et.
3. `Firestore Database` oluştur.
4. Web uygulaması ekleyip Firebase yapılandırma bilgilerini al.
5. Kök dizinde `.env` dosyası oluştur ve `.env.example` içeriğini doldur.
6. `firestore.rules` dosyasını Firebase tarafına yükle.

## Yönetici Hesabı Mantığı

- Sistemde tek yönetici hesabı vardır.
- `.env` dosyasındaki `VITE_ADMIN_EMAIL` değeri yönetici e-postasını belirler.
- Bu e-posta ile oluşturulan ilk hesap yönetici olur.
- Diğer tüm hesaplar otomatik olarak personel rolüyle açılır.

Önemli:

- `VITE_ADMIN_EMAIL` değerini değiştirirsen `firestore.rules` içindeki yönetici e-postasını da aynı şekilde güncellemelisin.
- Varsayılan örnek yönetici e-postası: `admin@pulsetrack.com`

## Örnek .env

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_ADMIN_EMAIL=admin@pulsetrack.com
```

## Firestore Koleksiyonları

- `users`
- `employees`
- `leaves`
- `announcements`

## Rol Yetkileri

### Yönetici

- Tüm personel kayıtlarını görür
- Personel kartlarını düzenler
- Tüm izin taleplerini onaylar veya reddeder
- Duyuru yayınlar ve siler
- Operasyon raporu indirir

### Personel

- Sadece kendi profilini görür
- Sadece kendi izin taleplerini görür
- Yeni izin talebi oluşturur
- Bekleyen kendi talebini siler
- Kendi günlük girişini verir
- Duyuruları okur

## Geliştirme ve Doğrulama

```bash
npm run lint
npm run build
```
