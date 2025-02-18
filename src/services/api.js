import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const processMessage = async(data) => {
    try {
        console.log('Sending to API:', data);
        const response = await axios.post(`${API_URL}/process-message`, {
            message: data.message,
            sector: data.sector
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        console.log('API Response:', response.data); // Para debugging
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};