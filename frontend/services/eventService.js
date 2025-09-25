import { fetchWithAuth } from './api';
class EventService {
    async createEvent(eventData) {
        const response = await fetchWithAuth('/api/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
        return response.json();
    }
    async getEvent(eventId) {
        const response = await fetchWithAuth(`/api/events/${eventId}`);
        return response.json();
    }
    async getEventsByTeam(teamId, params = {}) {
        const queryParams = new URLSearchParams();
        if (params.startDate)
            queryParams.append('startDate', params.startDate);
        if (params.endDate)
            queryParams.append('endDate', params.endDate);
        if (params.status)
            queryParams.append('status', params.status);
        const response = await fetchWithAuth(`/api/teams/${teamId}/events?${queryParams.toString()}`);
        return response.json();
    }
    async getVenueAvailability(venueId, date) {
        const response = await fetchWithAuth(`/api/venues/${venueId}/availability?date=${date}`);
        return response.json();
    }
    async getParkingStatus(venueId, eventId) {
        const response = await fetchWithAuth(`/api/venues/${venueId}/events/${eventId}/parking`);
        return response.json();
    }
    async getAttendancePrediction(eventId) {
        const response = await fetchWithAuth(`/api/events/${eventId}/prediction`);
        return response.json();
    }
    async updateEventStatus(eventId, status, details) {
        await fetchWithAuth(`/api/events/${eventId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, ...details }),
        });
    }
    async registerForEvent(eventId, playerId) {
        const response = await fetchWithAuth(`/api/events/${eventId}/register`, {
            method: 'POST',
            body: JSON.stringify({ playerId }),
        });
        return response.json();
    }
    async getEventStats(eventId) {
        const response = await fetchWithAuth(`/api/events/${eventId}/stats`);
        return response.json();
    }
}
export const eventService = new EventService();
