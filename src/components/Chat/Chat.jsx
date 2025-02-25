import { useState, useEffect } from 'react'
import './Chat.css'
import ChatInput from '../ChatInput/ChatInput'
import ChatMessage from '../ChatMessage/ChatMessage'

function Chat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('email')
  const [currentPhase, setCurrentPhase] = useState(1)
  
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    isRegistered: false,
    detectedLanguage: 'en'
  })

  const [phase2Data, setPhase2Data] = useState({
    sector: '',
    region: '',
    companies: [],
    countries: [],
  })

  useEffect(() => {
    addMessage({ 
      text: "Welcome! Please enter your email:", 
      type: 'bot' 
    })
  }, [])

  const addMessage = (message) => {
    setMessages(prev => [...prev, message])
  }

  const handleEmailCapture = async (email) => {
    try {
      const response = await fetch('http://127.0.0.1:8080/api/ai/email/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, text: email })
      })
      const data = await response.json()
      
      if (data.success) {
        setUserData(prev => ({
          ...prev,
          email,
          isRegistered: data.is_registered,
          detectedLanguage: data.detected_language
        }))
        addMessage({ text: data.message, type: 'bot' })
        setCurrentStep('name')
      }
    } catch (error) {
      console.error('Error processing email:', error)
      addMessage({ 
        text: `Error processing email: ${error.message}`, 
        type: 'bot', 
        isError: true 
      })
    }
  }

  const handleNameCapture = async (name) => {
    try {
      const response = await fetch('http://localhost:8080/api/ai/name/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: name,
          is_registered: userData.isRegistered
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setUserData(prev => ({ ...prev, name }))
        addMessage({ 
          text: data.message, 
          type: 'bot',
          options: data.options 
        })
        setCurrentStep('expert_connection')
      }
    } catch (error) {
      console.error('Error processing name:', error)
      addMessage({ 
        text: `Error processing name: ${error.message}`, 
        type: 'bot', 
        isError: true 
      })
    }
  }

  const handleExpertConnection = async (answer) => {
    try {
      const response = await fetch('http://localhost:8080/api/ai/expert-connection/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: answer,
          name: userData.name,
          detected_language: userData.detectedLanguage,
          previous_step: 'ask_expert_connection'
        })
      })
      const data = await response.json()
      
      if (data.success) {
        addMessage({ 
          text: data.message, 
          type: 'bot',
          options: data.options 
        })
        
        if (data.step === 'select_sector') {
          setCurrentPhase(2)
          setCurrentStep('sector_selection')
        } else if (answer.toLowerCase() === 'yes') {
          setCurrentPhase(2)
          setCurrentStep('sector')
        } else {
          setCurrentStep('complete')
        }
      }
    } catch (error) {
      console.error('Error in expert connection:', error)
      addMessage({ 
        text: `Error: ${error.message}`, 
        type: 'bot', 
        isError: true 
      })
    }
  }

  const handleSectorSelection = async (sector) => {
    try {
        addMessage({ 
            text: `Selected sector: ${sector}`, 
            type: 'user' 
        });

        const response = await fetch('http://localhost:8080/api/sector-experience', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sector,
                name: userData.name,
                language: userData.detectedLanguage
            })
        });
      
        const data = await response.json();
      
        if (data.success) {
            setPhase2Data(prev => ({ ...prev, sector }));
            addMessage({ 
                text: data.message, 
                type: 'bot',
                options: data.options 
            });
            setCurrentStep('region');
        }
    } catch (error) {
        console.error('Error handling sector selection:', error);
        addMessage({ 
            text: `Error: ${error.message}`, 
            type: 'bot', 
            isError: true 
        });
    }
  };

  const handleRegionInput = async (region) => {
    try {
        addMessage({ 
            text: region, 
            type: 'user' 
        });

        const response = await fetch('http://localhost:8080/api/ai/test/process-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: region,
                language: userData.detectedLanguage,
                name: userData.name
            })
        });

        const data = await response.json();

        if (data.success) {
            setPhase2Data(prev => ({ ...prev, region: data.processed_region }));
            addMessage({ 
                text: data.next_question, 
                type: 'bot',
                options: data.options 
            });
            setCurrentStep('companies');
        }
    } catch (error) {
        console.error('Error processing region:', error);
        addMessage({ 
            text: `Error: ${error.message}`, 
            type: 'bot', 
            isError: true 
        });
    }
  };

  const handleCompaniesInput = async (companies) => {
    try {
      addMessage({ 
        text: companies, 
        type: 'user' 
      });

      const response = await fetch('http://localhost:8080/api/simple-expert-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: companies,
          language: userData.detectedLanguage
        })
      });

      const data = await response.json();

      if (data.success) {
        setPhase2Data(prev => ({ 
          ...prev, 
          companies: data.companies || [] 
        }));
        
        addMessage({ 
          text: data.message, 
          type: 'bot',
          options: data.options 
        });
        
        if (data.interested_in_companies) {
          setCurrentStep('countries');
        } else {
          setCurrentStep('complete');
        }
      }
    } catch (error) {
      console.error('Error processing companies:', error);
      addMessage({ 
        text: `Error: ${error.message}`, 
        type: 'bot', 
        isError: true 
      });
    }
  };

  const handleSendMessage = async (data) => {
    try {
      setLoading(true)
      const userMessage = data.value
      addMessage({ text: userMessage, type: 'user' })

      if (currentPhase === 1) {
        switch (currentStep) {
          case 'email':
            await handleEmailCapture(userMessage)
            break
          case 'name':
            await handleNameCapture(userMessage)
            break
          case 'expert_connection':
            await handleExpertConnection(userMessage)
            break
          default:
            break
        }
      } else {
        switch (currentStep) {
          case 'sector_selection':
          case 'sector':
            await handleSectorSelection(userMessage)
            break
          case 'region':
            await handleRegionInput(userMessage)
            break
          case 'companies':
            await handleCompaniesInput(userMessage)
            break
          default:
            break
        }
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

  const isInputDisabled = () => {
    return loading || 
           currentStep === 'complete' || 
           (currentStep !== 'sector_selection' && 
            currentStep !== 'region' && 
            currentStep !== 'companies' &&
            currentStep === 'select_sector')
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Expert Consultation Bot</h2>
        <div className="phase-indicator">
          Phase {currentPhase}
        </div>
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
        disabled={isInputDisabled()}
        currentStep={currentStep}
        currentPhase={currentPhase}
        placeholder={
          currentStep === 'sector_selection' 
            ? "Please type one of the sectors listed above" 
            : currentStep === 'region'
            ? "Please specify the region you're interested in"
            : currentStep === 'companies'
            ? "Please enter the companies you're interested in, or type 'no'"
            : "Type your message..."
        }
      />
    </div>
  )
}

export default Chat