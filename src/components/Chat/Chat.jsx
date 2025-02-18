import { useState, useEffect } from 'react'
import './Chat.css'
import ChatInput from '../ChatInput/ChatInput'
import ChatMessage from '../ChatMessage/ChatMessage'
import { processMessage } from '../../services/api'

function Chat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [currentLocation, setCurrentLocation] = useState('')

  // Efecto para cargar los mensajes de bienvenida al iniciar
  useEffect(() => {
    const welcomeMessages = [
      {
        text: "Welcome to our Expert Consultation Service.",
        type: 'bot'
      },
      {
        text: "I can help you find companies based on location and sector.",
        type: 'bot'
      },
      {
        text: "Please enter a location (e.g., China, USA, Europe):",
        type: 'bot'
      }
    ];
    setMessages(welcomeMessages);
  }, []);

  const handleSendMessage = async (data) => {
    try {
      setLoading(true)

      if (data.type === 'location') {
        // Manejar la entrada de ubicación
        setCurrentLocation(data.value)
        setMessages(prev => [...prev,
          { text: data.value, type: 'user' },
          { text: "Please select a sector:", type: 'bot' }
        ])
        setStep(2)
        setLoading(false)
      } else if (data.type === 'complete') {
        // Manejar la selección del sector
        const requestData = {
          message: currentLocation,
          sector: data.sector
        };

        console.log('Sending to backend:', requestData);

        const response = await processMessage(requestData);
        console.log('Backend response:', response);

        // Agregar el mensaje del sector seleccionado
        setMessages(prev => [...prev, { 
          text: `Selected sector: ${data.sector}`, 
          type: 'user' 
        }]);

        if (response.success) {
          // Agregar la respuesta con las empresas
          setMessages(prev => [...prev, {
            text: response.message,
            type: 'bot',
            companies: response.companies
          }]);

          // Reiniciar para una nueva búsqueda
          setStep(1);
          setCurrentLocation('');
          setMessages(prev => [...prev, {
            text: "Would you like to search for more companies? Please enter a new location:",
            type: 'bot'
          }]);
        } else {
          setMessages(prev => [...prev, {
            text: response.message || "An error occurred",
            type: 'bot',
            isError: true
          }]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, there was an error processing your request.",
        type: 'bot',
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Expert Consultation Bot</h2>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index}
            text={message.text}
            type={message.type}
            companies={message.companies}
            isError={message.isError}
          />
        ))}
        {loading && <div className="loading">Processing your request...</div>}
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={loading}
        step={step}
      />
    </div>
  )
}

export default Chat