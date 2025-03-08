import { useEffect } from 'react';
import Chat from "./components/Chat/Chat"

function App() {
  useEffect(() => {
    // Ping inmediato al cargar la página
    fetch('https://expert-consultation-bot-back.vercel.app/api/ping')
      .then(response => {
        if (response.ok) {
          console.log('Servidor iniciado:', new Date().toLocaleString());
        }
      })
      .catch(error => console.error('Error inicial:', error));

    // Ping más frecuente en los primeros minutos
    const initialPingInterval = setInterval(() => {
      fetch('https://expert-consultation-bot-back.vercel.app/api/ping')
        .then(response => {
          if (response.ok) {
            console.log('Servidor activo (frecuente):', new Date().toLocaleString());
          }
        })
        .catch(error => console.error('Error de ping:', error));
    }, 30000); // Cada 30 segundos

    // Después de 5 minutos, cambiar a intervalo normal
    setTimeout(() => {
      clearInterval(initialPingInterval);
      
      const regularPingInterval = setInterval(() => {
        fetch('https://expert-consultation-bot-back.vercel.app/api/ping')
          .then(response => {
            if (response.ok) {
              console.log('Servidor activo (normal):', new Date().toLocaleString());
            }
          })
          .catch(error => console.error('Error de ping:', error));
      }, 840000); // Cada 14 minutos

      return () => clearInterval(regularPingInterval);
    }, 300000); // Después de 5 minutos

    return () => clearInterval(initialPingInterval);
  }, []);

  return (
    <div className="App">
      <Chat/>
    </div>
  )
}

export default App