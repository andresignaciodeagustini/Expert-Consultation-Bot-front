import { useEffect } from 'react';
import Chat from "./components/Chat/Chat"

function App() {
  useEffect(() => {
    const pingInterval = setInterval(() => {
      fetch('https://expert-consultation-bot-back.vercel.app/api/ping')
        .then(response => {
          if (response.ok) {
            console.log('Servidor activo:', new Date().toLocaleString());
          }
        })
        .catch(error => console.error('Error de ping:', error));
    }, 50000);

    return () => clearInterval(pingInterval);
  }, []);

  return (
    <div className="App">
      <Chat/>
    </div>
  )
}

export default App