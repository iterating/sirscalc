const API_ENDPOINTS = {
    calculate: '/api/sirs/calculate',
    history: '/api/sirs/history',
    clearHistory: '/api/sirs/clear'
};

class ApiService {
    async calculateSIRS(data) {
        console.log('Sending calculation request:', data);
        const response = await fetch(API_ENDPOINTS.calculate, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log('Response data:', result);

        if (!result.success) {
            throw new Error(result.error || 'Unknown error occurred');
        }

        return result.data;
    }

    async getHistory() {
        console.log('Fetching history from:', API_ENDPOINTS.history);
        const response = await fetch(API_ENDPOINTS.history, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log('History data:', result);

        if (!result.success) {
            throw new Error(result.error || 'Failed to load history');
        }

        return result.data;
    }

    async clearHistory() {
        console.log('Clearing all calculations');
        const response = await fetch(API_ENDPOINTS.clearHistory, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to clear history');
        }
    }
}

export const apiService = new ApiService();
