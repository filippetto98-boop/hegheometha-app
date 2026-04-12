import api from './client'

export const getNotifiche = () => api.get('/api/notifiche/').then(r => r.data)
export const segnaLetta = (id) => api.post(`/api/notifiche/${id}/letta/`).then(r => r.data)
