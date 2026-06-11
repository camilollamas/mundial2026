import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

// Aviso de nueva versión de la PWA: chequea cada hora y al volver a la app;
// al tocar "Actualizar" instala el service worker nuevo y recarga.
export default function UpdateToast() {
  const [show, setShow] = useState(false)
  const updateRef = useRef(null)

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setShow(true)
      },
      onRegisteredSW(_url, registration) {
        if (!registration) return
        const check = () => registration.update().catch(() => {})
        const id = setInterval(check, 60 * 60 * 1000)
        const onVisible = () => document.visibilityState === 'visible' && check()
        document.addEventListener('visibilitychange', onVisible)
        // nota: la app vive toda la sesión, no hace falta limpiar
      },
    })
    updateRef.current = updateSW
  }, [])

  if (!show) return null

  return (
    <div className="update-toast" role="status">
      <span>🔄 Hay una nueva versión disponible</span>
      <div className="update-actions">
        <button className="btn sm" onClick={() => updateRef.current?.(true)}>
          Actualizar
        </button>
        <button className="btn ghost sm" onClick={() => setShow(false)}>
          Luego
        </button>
      </div>
    </div>
  )
}
