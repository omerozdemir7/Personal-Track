import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const requiredFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseConfig = {
  ...requiredFirebaseConfig,
  ...(import.meta.env.VITE_FIREBASE_DATABASE_URL
    ? { databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL }
    : {}),
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    ? { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID }
    : {}),
}

export const hasFirebaseConfig = Object.values(requiredFirebaseConfig).every(Boolean)
export const hasAppConfig = hasFirebaseConfig

export const configurationIssues = [
  !hasFirebaseConfig
    ? 'VITE_FIREBASE_* değişkenleri eksik. Firebase web yapılandırmasını girin.'
    : null,
].filter(Boolean)

export const firebaseApp = hasFirebaseConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null

export const assertFirebaseReady = () => {
  if (!hasFirebaseConfig || !auth || !db) {
    throw new Error('Firebase yapılandırması eksik. .env dosyasını kontrol edin.')
  }
}

export const assertAppConfigured = () => {
  assertFirebaseReady()
}
