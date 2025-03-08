import { useEffect } from 'react';
import Chat from "./components/Chat/Chat"

function App() {
  useEffect(() => {
    // Ping inmediato al cargar la página
    fetch('https://expert-consultation-bot-back-ab9540834110.herokuapp.com/api/ping', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        console.log('Servidor iniciado:', new Date().toLocaleString());
      }
    })
    .catch(error => console.error('Error inicial:', error));

    // Ping cada 14 minutos
    const pingInterval = setInterval(() => {
      fetch('https://expert-consultation-bot-back-ab9540834110.herokuapp.com/api/ping', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          console.log('Servidor activo:', new Date().toLocaleString());
        }
      })
      .catch(error => console.error('Error de ping:', error));
    }, 840000);

    return () => clearInterval(pingInterval);
  }, []);

  return (
    <div className="App">
      <Chat/>
    </div>
  )
}

export default App