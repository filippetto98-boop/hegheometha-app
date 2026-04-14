import api from './client'

export const getDashboard = () => api.get('/api/hr/dashboard/').then(r => r.data)
export const getTitolareDashboard = () => api.get('/api/hr/titolare/dashboard/').then(r => r.data)
export const timbra = (tipo, lat, lng) => api.post('/api/hr/timbra/', { tipo, latitudine: lat, longitudine: lng }).then(r => r.data)
export const richiediAssenza = (data) => api.post('/api/hr/assenza/', data).then(r => r.data)
export const gestisciAssenza = (id, azione, note = '') => api.post(`/api/hr/assenza/${id}/gestisci/`, { azione, note }).then(r => r.data)
export const getSpese = () => api.get('/api/hr/spese/').then(r => r.data)
export const aggiungiSpesaRapida = (data) => api.post('/api/hr/spesa-rapida/', data).then(r => r.data)
export const getTurniMese = (mese) => api.get(`/api/hr/turni/?mese=${mese}`).then(r => r.data)
export const inviaNotaSpese = (id) => api.post(`/api/hr/spese/${id}/invia/`).then(r => r.data)
export const gestisciNotaSpese = (id, azione, note = '') => api.post(`/api/hr/spese/${id}/gestisci/`, { azione, note }).then(r => r.data)
export const getNoteSpeseTitolare = () => api.get('/api/hr/spese/titolare/').then(r => r.data)
export const scanScontrino = (formData) => api.post('/api/hr/scan-scontrino/', formData).then(r => r.data)
