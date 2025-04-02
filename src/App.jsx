import { useState, useEffect } from 'react';
import Chat from "./components/Chat/Chat";
import ChatButton from "./components/ChatButton/ChatButton";
import './App.css';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(prevState => !prevState);
  };

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
    <div className="app-container">
      <div className="content">
        {/* Aquí puedes agregar el contenido principal de tu aplicación */}
      </div>
      
      {/* Mostramos el chat sólo si isChatOpen es true */}
      {isChatOpen && (
        <div className="chat-overlay">
          <div className="chat-header">
            <button 
              className="close-button" 
              onClick={toggleChat} 
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          <div className="chat-content">
            <Chat key="chat-instance" />
          </div>
        </div>
      )}
      
      {/* El botón siempre está visible */}
      <ChatButton onClick={toggleChat} isOpen={isChatOpen} />
    </div>
  );
}

export default App;