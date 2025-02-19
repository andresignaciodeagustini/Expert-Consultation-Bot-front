import { useState, useEffect } from 'react'
import './Chat.css'
import ChatInput from '../ChatInput/ChatInput'
import ChatMessage from '../ChatMessage/ChatMessage'
import { processMessage } from '../../services/api'

function Chat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState('')
  const [awaitingSector, setAwaitingSector] = useState(false)
  const VALID_SECTORS = ["Technology", "Financial Services", "Manufacturing"]

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
      const userMessage = data.value;
      
      // Agregar mensaje del usuario
      setMessages(prev => [...prev, { text: userMessage, type: 'user' }]);

      if (!currentLocation) {
        // Primera etapa: guardar ubicación
        setCurrentLocation(userMessage)
        setAwaitingSector(true)
        setMessages(prev => [...prev, {
          text: `Please tell me which sector you're interested in. Available sectors are: ${VALID_SECTORS.join(', ')}`,
          type: 'bot'
        }])
      } else if (awaitingSector) {
        // Segunda etapa: procesar sector
        const sector = VALID_SECTORS.find(s => 
          userMessage.toLowerCase().includes(s.toLowerCase())
        );

        if (!sector) {
          setMessages(prev => [...prev, {
            text: `I couldn't recognize that sector. Please choose from: ${VALID_SECTORS.join(', ')}`,
            type: 'bot'
          }]);
        } else {
          const requestData = {
            message: currentLocation,
            sector: sector
          };

          console.log('Sending to backend:', requestData);
          const response = await processMessage(requestData);
          console.log('Backend response:', response);

          if (response.success) {
            setMessages(prev => [...prev, {
              text: response.message,
              type: 'bot',
              companies: response.companies
            }]);

            // Reiniciar para nueva búsqueda
            setCurrentLocation('');
            setAwaitingSector(false);
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
      />
    </div>
  )
}

export default Chat