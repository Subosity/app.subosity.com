import { useState, useEffect } from 'react'

const PWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    setInstallPrompt(null)
  }

  if (!installPrompt) return null

  return (
    <div className="position-fixed bottom-0 end-0 m-3">
      <button 
        className="btn btn-primary"
        onClick={handleInstallClick}
      >
        Install App
      </button>
    </div>
  )
}

export default PWAInstall