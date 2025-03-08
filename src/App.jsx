import { useEffect } from 'react';
import Chat from "./components/Chat/Chat"

function App() {
  const makeRequest = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'same-origin'  // Cambiado de 'include' a 'same-origin'
      });
      
      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en la petición:', error);
      return false;
    }
  };

  useEffect(() => {
    const API_URL = 'https://expert-consultation-bot-back-ab9540834110.herokuapp.com/api/ping';

    // Ping inmediato al cargar la página
    makeRequest(API_URL)
      .then(success => {
        if (success) {
          console.log('Servidor iniciado:', new Date().toLocaleString());
        }
      });

    // Ping más frecuente en los primeros minutos
    const initialPingInterval = setInterval(async () => {
      const success = await makeRequest(API_URL);
      if (success) {
        console.log('Servidor activo (frecuente):', new Date().toLocaleString());
      }
    }, 30000); // Cada 30 segundos

    // Después de 5 minutos, cambiar a intervalo normal
    const timeoutId = setTimeout(() => {
      clearInterval(initialPingInterval);
      
      const regularPingInterval = setInterval(async () => {
        const success = await makeRequest(API_URL);
        if (success) {
          console.log('Servidor activo (normal):', new Date().toLocaleString());
        }
      }, 840000); // Cada 14 minutos

      return () => clearInterval(regularPingInterval);
    }, 300000); // Después de 5 minutos

    // Limpieza
    return () => {
      clearInterval(initialPingInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="App">
      <Chat/>
    </div>
  );
}

export default App;