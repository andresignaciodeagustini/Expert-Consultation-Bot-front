import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const processMessage = async(data) => {
    try {
        console.log('Sending to API:', data);
        const response = await axios.post(`${API_URL}/process-message`, {
            message: data.message,
            sector: data.sector
        });
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};