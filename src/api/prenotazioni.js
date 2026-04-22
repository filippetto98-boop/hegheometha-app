import api from './client'

export const getPrenotazioni = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return api.get(`/api/prenotazioni/?${query}`).then(r => r.data)
}

export const getPrenotazione = (id) => api.get(`/api/prenotazioni/${id}/`).then(r => r.data)

export const aggiornaStato = (id, stato) => api.post(`/api/prenotazioni/${id}/stato/`, { stato }).then(r => r.data)
