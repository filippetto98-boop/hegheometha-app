import api from './client'

export const getMagazzino = () => api.get('/api/magazzino/').then(r => r.data)
export const aggiornaQuantita = (id, quantita) => api.post(`/api/magazzino/${id}/quantita/`, { quantita }).then(r => r.data)
