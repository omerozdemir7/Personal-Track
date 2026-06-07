import { useEffect, useState } from 'react'

export const useActionRunner = () => {
  const [busyAction, setBusyAction] = useState('')
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const runAction = async (actionKey, successMessage, action, options = {}) => {
    try {
      setBusyAction(actionKey)
      await action()

      if (!options.skipNotice) {
        setNotice({ type: 'success', message: successMessage })
      }

      return true
    } catch (error) {
      setNotice({
        type: 'error',
        message:
          error?.message ||
          'İşlem sırasında bir sorun oluştu. Lütfen tekrar deneyin.',
      })
      return false
    } finally {
      setBusyAction('')
    }
  }

  return { busyAction, notice, setNotice, runAction }
}
