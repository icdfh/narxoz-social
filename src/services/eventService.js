// src/api/eventsService.js
import apiClient from '../utils/apiClient';

// EVENTS CRUD
export const fetchEvents           = () => apiClient.get('/events/');
export const fetchActiveEvents     = () => apiClient.get('/events/active/');
export const fetchFinishedEvents   = () => apiClient.get('/events/finished/');
export const fetchMyEvents         = () => apiClient.get('/events/my/');
export const fetchEventsByUser     = (userId) => apiClient.get(`/events/by-user/${userId}/`);
export const fetchEventDetail      = (id) => apiClient.get(`/events/${id}/`);
export const createEvent           = (data) => apiClient.post('/events/', data);
export const updateEvent           = (id, data) => apiClient.put(`/events/${id}/`, data);
export const deleteEvent           = (id) => apiClient.delete(`/events/${id}/`);

// SUBSCRIPTIONS
export const subscribeEvent        = (id) => apiClient.post(`/events/subscribe/${id}/`);
export const unsubscribeEvent      = (id) => apiClient.post(`/events/unsubscribe/${id}/`);
export const fetchMySubscriptions         = () => apiClient.get('/events/my-subscriptions/');
export const fetchSubscriptionDetail      = (id) => apiClient.get(`/events/subscription/${id}/`);
export const fetchMyActiveSubscriptions   = () => apiClient.get('/events/my/active-subscriptions/');
export const fetchMyFinishedSubscriptions = () => apiClient.get('/events/my/finished-subscriptions/');

// REMINDERS / ADMIN
export const fetchAllReminded      = () => apiClient.get('/events/all-reminded/');
export const fetchSubscriptionsByEvent = (eventId) => apiClient.get(`/events/subscriptions/by-event/${eventId}/`);
