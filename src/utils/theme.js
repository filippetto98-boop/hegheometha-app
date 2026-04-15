export function applicaColoreAzienda() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const colore = user?.azienda?.colore_primario
    if (colore && /^#[0-9A-Fa-f]{6}$/.test(colore)) {
      document.documentElement.style.setProperty('--accent', colore)
      document.documentElement.style.setProperty('--accent-dark', colore + 'CC')
    }
  } catch {}
}
