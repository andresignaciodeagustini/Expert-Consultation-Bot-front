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


export const processVoice = async(audioBlob, step, region = null) => {
    try {

        const formData= new FormData();
        formData.append('audio', audioBlob, 'audio.wav');
        formData.append('step', step);
        if (region){
            formData.append('region',region);
        }

        const response = await axios.post(`${API_URL}/api/ai/voice/process`, formData, {
            headers: {
                'Content-Type':'multipart/form-data',
            }
        });
        console.log('Voice API Response:', response.data);
        return response.data;


    } catch(error){
        console.error('Voice API Error:', error)
        throw error;
    }
}