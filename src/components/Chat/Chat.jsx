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
  const [currentStep, setCurrentStep] = useState('region')

  useEffect(() => {
    const welcomeMessages = [
      { text: "Welcome to our Expert Consultation Service.", type: 'bot' },
      { text: "I can help you find companies based on location and sector.", type: 'bot' },
      { text: "Please enter a location (e.g., China, USA, Europe):", type: 'bot' }
    ]
    setMessages(welcomeMessages)
  }, [])

  const addMessage = (message) => {
    setMessages(prev => [...prev, message])
  }

  const resetState = (detected_language) => {
    setCurrentLocation('')
    setAwaitingSector(false)
    setCurrentStep('region')
    
    const newLocationPrompt = detected_language === 'es'
      ? "¿Desea buscar más empresas? Por favor, ingrese una nueva ubicación:"
      : "Would you like to search for more companies? Please enter a new location:"
    
    addMessage({ text: newLocationPrompt, type: 'bot' })
  }

  const handleSendMessage = async (data) => {
    try {
      setLoading(true)
      const userMessage = data.value

      // Mostrar mensaje del usuario si no es un error
      if (data.type === 'message') {
        addMessage({ text: userMessage, type: 'user' })

        if (!currentLocation) {
          // Procesando ubicación
          try {
            const response = await fetch('http://localhost:8080/api/ai/test/process-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: userMessage })
            })
            
            const responseData = await response.json()
            
            if (responseData.success) {
              setCurrentLocation(responseData.region)
              setCurrentStep('sector')
              setAwaitingSector(true)
              addMessage({
                text: responseData.message,
                type: 'bot',
                messages: responseData.messages,
                detected_language: responseData.detected_language
              })
            } else {
              addMessage({
                text: responseData.message || "An error occurred",
                type: 'bot',
                isError: true
              })
            }
          } catch (error) {
            console.error('Error:', error)
            addMessage({
              text: "Error processing region",
              type: 'bot',
              isError: true
            })
          }
        } else if (awaitingSector) {
          // Procesando sector
          const response = await processMessage({
            message: currentLocation,
            sector: userMessage
          })

          if (response.success) {
            addMessage({
              text: response.message,
              type: 'bot',
              companies: response.companies,
              messages: response.messages,
              detected_language: response.detected_language,
              sector: response.sector
            })
            resetState(response.detected_language)
          } else {
            addMessage({
              text: response.message || "An error occurred",
              type: 'bot',
              isError: true
            })
          }
        }
      } else if (data.type === 'error') {
        // Manejo de errores
        addMessage({
          text: data.value,
          type: 'bot',
          isError: true
        })
      }
    } catch (error) {
      console.error('Error:', error)
      addMessage({
        text: "Sorry, there was an error processing your request.",
        type: 'bot',
        isError: true
      })
    } finally {
      setLoading(false)
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
            {...message}
          />
        ))}
        {loading && <div className="loading">Processing your request...</div>}
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={loading}
        currentStep={currentStep}
        currentRegion={currentLocation}
      />
    </div>
  )
}

export default Chat