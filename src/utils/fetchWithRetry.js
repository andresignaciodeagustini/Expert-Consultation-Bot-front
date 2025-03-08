// src/utils/fetchWithRetry.js

export const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
      } catch (error) {
        console.error(`Intento ${i + 1} fallido:`, error);
        if (i === maxRetries - 1) throw error;
        // Esperar antes de reintentar (tiempo exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  };