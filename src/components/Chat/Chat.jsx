import { useState, useEffect } from 'react'
import './Chat.css'
import ChatInput from '../ChatInput/ChatInput'
import ChatMessage from '../ChatMessage/ChatMessage'

function Chat() {
  const [messages, setMessages] = useState([])  // Inicializado vacío
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
    processed_region: '',
    language: '',         
    companies: [],
    interested_in_companies: false
  })

  const [phase3Data, setPhase3Data] = useState({
    // Estados para evaluación
    evaluationRequired: false, // Se activa cuando el usuario acepta hacer preguntas
    evaluationSections: {
      current: null,  // Categoría actual siendo evaluada
      remaining: [],  // Categorías pendientes de evaluar
      completed: [],  // Categorías ya evaluadas
      questions: {},  // Almacena las preguntas por categoría
      selected_categories: {
        main: true,     // Siempre activa si se aceptan preguntas
        client: false,  // Se activa solo si hay interés en perspectiva cliente
        supply_chain: false  // Se activa solo si hay interés en cadena de suministro
      }
    },
  
    // Estados para empresas y perspectivas
    clientCompanies: [],
    clientPerspective: false,  // Se actualizará según la respuesta del usuario
    supplyChainCompanies: [],
    supplyChainPerspective: false,  // Se actualizará según la respuesta del usuario
    supplyChainRequired: "",
    excludedCompanies: [],
  
    // Estados para expertos
    selectedExperts: {
      companies: [],
      clients: [],
      suppliers: []
    },
    finalSelectedExperts: [],
  
    // Estados para filtros y métricas
    filtersApplied: {
      detected_language: 'es-ES'
    },
    employmentStatus: "both",
    totalMatches: 0,
    uniqueCompanies: 0,
    supplyChainTotalMatches: 0,
    supplyChainUniqueCompanies: 0
  });


  // useEffect para sincronizar el idioma en todos los estados
  useEffect(() => {
    setPhase2Data(prev => ({
      ...prev,
      language: userData.detectedLanguage
    }));

    setPhase3Data(prev => ({
      ...prev,
      filtersApplied: {
        ...prev.filtersApplied,
        detected_language: userData.detectedLanguage
      }
    }));
  }, [userData.detectedLanguage]);

  const addMessage = (message) => {
    setMessages(prev => [...prev, message])
  }

// Nuevo useEffect para el mensaje de bienvenida (reemplaza los dos existentes)
useEffect(() => {
  const fetchWelcomeMessage = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8080/api/welcome-message')
      const data = await response.json()
      
      if (data.success) {
        if (data.is_english_speaking) {
          // Para países de habla inglesa
          setMessages([
            {
              text: data.messages.greeting.english,
              type: 'bot',
              className: 'chat-message bot'
            },
            {
              text: data.messages.instruction.english,
              type: 'bot',
              className: 'chat-message bot'
            }
          ]);
        } else {
          // Para países no ingleses, mostrar los cuatro mensajes separados
          setMessages([
            // Mensaje de bienvenida en inglés
            {
              text: data.messages.greeting.english,
              type: 'bot',
              className: 'chat-message bot'
            },
            // Mensaje de bienvenida traducido
            {
              text: data.messages.greeting.translated,
              type: 'bot',
              className: 'chat-message bot'
            },
            // Instrucciones en inglés
            {
              text: data.messages.instruction.english,
              type: 'bot',
              className: 'chat-message bot'
            },
            // Instrucciones traducidas
            {
              text: data.messages.instruction.translated,
              type: 'bot',
              className: 'chat-message bot'
            }
          ]);
        }
        
        setUserData(prev => ({
          ...prev,
          detectedLanguage: data.detected_language,
          countryCode: data.country_code
        }))
      } else {
        setMessages([{
          text: "Welcome to Silverlight Research Expert Network! Please enter your email:",
          type: 'bot',
          className: 'chat-message bot'
        }])
      }
    } catch (error) {
      console.error('Error fetching welcome message:', error)
      setMessages([{
        text: "Welcome to Silverlight Research Expert Network! Please enter your email:",
        type: 'bot',
        className: 'chat-message bot'
      }])
    }
  }

  fetchWelcomeMessage()
}, [])




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


///////////////////////////////////////////////////////////////////////////////////////adfgsdfg










  const handleSectorSelection = async (sector) => {
    try {
        
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
            setPhase2Data(prev => ({ ...prev, processed_region: data.processed_region }));
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
        // Si el usuario responde "no" a la lista
        if (companies.toLowerCase() === 'no') {
            // Llamamos directamente a handleCompanySuggestions para obtener una nueva lista
            await handleCompanySuggestions();
            return; // Terminamos aquí la ejecución
        }

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
            const isInterested = companies.toLowerCase() !== 'no';

            setPhase2Data(prev => ({ 
                ...prev, 
                companies: data.companies || [],
                interested_in_companies: isInterested,
                isCompleted: true
            }));

            addMessage({ 
                text: data.message, 
                type: 'bot',
                options: data.options 
            });

            // Primero actualizamos Phase3Data
            if (isInterested) {
                setPhase3Data(prev => ({
                    ...prev,
                    companiesForExpertSearch: data.companies || [],
                    currentExpertStep: 'initial'
                }));
            }

            // Luego llamamos a handleCompanySuggestions
            await handleCompanySuggestions();
        }
    } catch (error) {
        console.error('Error processing companies:', error);
        addMessage({
            text: `Error: ${error.message}`,
            type: 'bot',
            isError: true
        });
    }
}

const handleCompanySuggestions = async () => {
  try {
    setLoading(true);

    const bodyData = {
      sector: phase2Data.sector,
      processed_region: phase2Data.processed_region,
      interested_in_companies: phase2Data.interested_in_companies,
      language: userData.detectedLanguage
    };

    if (phase2Data.interested_in_companies) {
      bodyData.companies = phase2Data.companies;
    }

    const response = await fetch('http://localhost:8080/api/company-suggestions-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    const data = await response.json();
    console.log('Response data:', data);

    if (data.success && Array.isArray(data.companies)) {
      setPhase2Data(prev => ({
        ...prev,
        companies: data.companies
      }));

      const baseMessage = data.message?.split('\n\n')[0] || 'Empresas Recomendadas';

      const companiesHtml = `
        <div class="suggestions-container">
          <h3 class="suggestions-title">${baseMessage}</h3>
          <div class="companies-grid">
            ${data.companies.map((company, index) => `
              <div class="company-card">
                <div class="company-number">${index + 1}</div>
                <div class="company-name">${company}</div>
              </div>
            `).join('')}
          </div>
         
        </div>
      `;

      addMessage({
        text: companiesHtml,
        type: 'bot',
        isHtml: true
      });

      setCurrentStep('next_step');
    } else {
      const errorMessage = data.message || 
        (!Array.isArray(data.companies) ? 'Invalid company data received' : 'Error getting company suggestions');
      
      addMessage({
        text: errorMessage,
        type: 'bot',
        isError: true
      });
    }
  } catch (error) {
    console.error('Error getting company suggestions:', error);
    addMessage({
      text: 'Error getting company suggestions. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false);
  }
};

  const handleCompanyAgreement = async (userMessage) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8080/api/process-companies-agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMessage,
          language: userData.detectedLanguage
        })
      });
  
      const data = await response.json();
  
      if (data.success) {
        addMessage({
          text: data.message,
          type: 'bot'
        });
  
        // Corregido: verificar la intención correctamente
        if (data.agreed.intention.toLowerCase() === 'yes') {
          console.log('User agreed, proceeding to employment status');
          setCurrentStep('employment_status'); // Agregado para mantener el estado actualizado
          setTimeout(() => {
            handleEmploymentStatus();
          }, 1000);
        } else {
          console.log('User disagreed, generating new list');
          setCurrentStep('companies'); // Agregado para volver al paso de compañías
          setTimeout(() => {
            handleCompanySuggestions();
          }, 1000);
        }
      } else {
        addMessage({
          text: data.message || 'Error processing your response. Please try again.',
          type: 'bot',
          isError: true
        });
      }
    } catch (error) {
      console.error('Error processing company agreement:', error);
      addMessage({
        text: 'Error processing your response. Please try again.',
        type: 'bot',
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };









/////////////////////////////////////FASE3/////////////////////////////////////////////////////






const handleEmploymentStatus = async () => {
  console.log('🟦 [handleEmploymentStatus] Iniciando');
  try {
    setLoading(true);
    
    const requestBody = {
      language: userData.detectedLanguage
    };
    console.log('🟦 [handleEmploymentStatus] Request:', requestBody);
    
    const response = await fetch('http://localhost:8080/api/specify-employment-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('🟦 [handleEmploymentStatus] Respuesta:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      setCurrentStep('employment_status');
      console.log('🟦 [handleEmploymentStatus] Step actualizado a: employment_status');
    }
  } catch (error) {
    console.error('🔴 [handleEmploymentStatus] Error:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false);
    console.log('🟦 [handleEmploymentStatus] Finalizado');
  }
};

const handleEmploymentStatusResponse = async (status) => {
  console.log('🟨 [handleEmploymentStatusResponse] Iniciando con status:', status);
  try {
    setLoading(true);

    const requestBody = {
      status: status,
      language: userData.detectedLanguage
    };
    console.log('🟨 [handleEmploymentStatusResponse] Request:', requestBody);

    const response = await fetch('http://localhost:8080/api/specify-employment-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('🟨 [handleEmploymentStatusResponse] Respuesta:', data);

    if (data.success) {
      console.log('🟨 [handleEmploymentStatusResponse] Actualizando phase3Data con:', data.employment_status);
      setPhase3Data(prev => ({
        ...prev,
        employmentStatus: data.employment_status
      }));
      
      addMessage({
        text: data.message,
        type: 'bot'
      });
      
      console.log('🟨 [handleEmploymentStatusResponse] Iniciando timeout para handleExcludeCompanies');
      setTimeout(handleExcludeCompanies, 1000);
    }
  } catch (error) {
    console.error('🔴 [handleEmploymentStatusResponse] Error:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false);
    console.log('🟨 [handleEmploymentStatusResponse] Finalizado');
  }
};

const handleExcludeCompanies = async () => {
  console.log('🟩 [handleExcludeCompanies] Iniciando');
  try {
    const requestBody = {
      language: userData.detectedLanguage
    };
    console.log('🟩 [handleExcludeCompanies] Request:', requestBody);

    const response = await fetch('http://localhost:8080/api/exclude-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('🟩 [handleExcludeCompanies] Respuesta:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      setCurrentStep('exclude_companies');
      console.log('🟩 [handleExcludeCompanies] Step actualizado a: exclude_companies');
    }
  } catch (error) {
    console.error('🔴 [handleExcludeCompanies] Error:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    console.log('🟩 [handleExcludeCompanies] Finalizado');
  }
};



const handleExcludeCompaniesResponse = async (answer) => {
  console.log('🔍 Estado actual antes de excluir compañías:', phase3Data);
  console.log('📥 Compañías a excluir:', answer);
  try {
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage,
      excluded_companies: answer.toLowerCase() === 'no' ? [] : answer.split(',').map(company => company.trim())
    };
    console.log('📤 Enviando solicitud a exclude-companies:', requestBody);

    const response = await fetch('http://localhost:8080/api/exclude-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta recibida de exclude-companies:', data);

    if (data.success) {
      // Actualizar estado de manera síncrona
      await new Promise(resolve => {
        setPhase3Data(prev => {
          const newState = {
            ...prev,
            excludedCompanies: data.excluded_companies || []
          };
          console.log('✅ Nuevo estado de phase3Data:', newState);
          resolve();
          return newState;
        });
      });

      addMessage({
        text: data.message,
        type: 'bot'
      });

      // Esperar un momento antes de continuar
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleClientPerspective();
    }
  } catch (error) {
    console.error('❌ Error en handleExcludeCompaniesResponse:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  }
};




/////////////////////////////////////CLIENT PERSPECTIVE
const handleClientPerspective = async () => {
  console.log('🚀 Iniciando handleClientPerspective');
  try {
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage,
      phase3_data: phase3Data // Incluir datos actuales
    };
    console.log('📤 Enviando solicitud a client-perspective:', requestBody);

    const response = await fetch('http://localhost:8080/api/client-perspective', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta recibida de client-perspective:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      setCurrentStep('client_perspective');
    }
  } catch (error) {
    console.error('❌ Error en handleClientPerspective:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  }
};


const handleClientPerspectiveResponse = async (answer) => {
  console.log('🔍 Estado actual antes de client perspective:', phase3Data);
  console.log('📥 Perspectiva del cliente recibida:', answer);
  
  try {
    const requestBody = {
      answer: answer,
      sector: phase3Data.sector,
      region: phase3Data.region,
      language: userData.detectedLanguage
    };
    console.log('📤 Enviando solicitud a client-perspective:', requestBody);

    const response = await fetch('http://localhost:8080/api/client-perspective', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta recibida de client-perspective:', data);

    if (data.success) {
      // Mensaje principal
      addMessage({
        text: data.message,
        type: 'bot'
      });

      // Determinar si la respuesta es afirmativa
      const isClientInterested = answer.toLowerCase() === 'yes' || 
                               answer.toLowerCase() === 'sí' || 
                               answer.toLowerCase() === 'si';

      // Lista de empresas con estilo (solo si hay respuesta afirmativa)
      if (isClientInterested && data.suggested_companies?.length > 0) {
        const companiesHtml = `
          <div class="suggestions-container client-companies">
            
            <div class="companies-grid">
              ${data.suggested_companies.map((company, index) => `
                <div class="company-card">
                  <div class="company-number">${index + 1}</div>
                  <div class="company-name">${company}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        addMessage({
          text: companiesHtml,
          type: 'bot',
          isHtml: true
        });
      }

      // Actualizar estado
      setPhase3Data(prev => ({
        ...prev,
        clientPerspective: isClientInterested,
        clientCompanies: isClientInterested ? (data.suggested_companies || []) : [],
        totalMatches: isClientInterested ? (data.total_matches || 0) : 0,
        uniqueCompanies: isClientInterested ? (data.unique_companies || 0) : 0,
        evaluationSections: {
          ...prev.evaluationSections,
          selected_categories: {
            ...prev.evaluationSections.selected_categories,
            client: isClientInterested // Activar solo si la respuesta es afirmativa
          }
        }
      }));

      // Continuar con supply chain
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleSupplyChainExperience();
    }
  } catch (error) {
    console.error('❌ Error en handleClientPerspectiveResponse:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  }
};



















const handleSupplyChainExperience = async () => {
  console.log('Iniciando handleSupplyChainExperience');
  try {
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage
    };
    console.log('Enviando solicitud inicial a supply-chain-experience:', requestBody);

    const response = await fetch('http://localhost:8080/api/supply-chain-experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de supply-chain-experience:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      setCurrentStep('supply_chain_experience');
    } else {
      throw new Error(data.message || 'Error en la solicitud de supply chain experience');
    }
  } catch (error) {
    console.error('Error en handleSupplyChainExperience:', error);
    addMessage({
      text: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};


const handleSupplyChainExperienceResponse = async (answer) => {
  console.log('🔍 Estado actual antes de supply chain:', phase3Data);
  console.log('📥 Respuesta supply chain:', answer);
  
  try {
    const requestBody = {
      answer: answer,
      sector: phase3Data.sector,
      region: phase3Data.region,
      language: userData.detectedLanguage
    };
    console.log('📤 Enviando respuesta a supply-chain-experience:', requestBody);

    const response = await fetch('http://localhost:8080/api/supply-chain-experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 Respuesta recibida del servidor:', data);

    if (data.success) {
      // Mensaje principal
      addMessage({
        text: data.message,
        type: 'bot'
      });

      // Determinar si la respuesta es afirmativa
      const isSupplyChainInterested = answer.toLowerCase() === 'yes' || 
                                    answer.toLowerCase() === 'sí' || 
                                    answer.toLowerCase() === 'si';

      // Lista de empresas con estilo (solo si hay respuesta afirmativa)
      if (isSupplyChainInterested && data.suggested_companies?.length > 0) {
        const companiesHtml = `
          <div class="suggestions-container supply-chain-companies">
            
            <div class="companies-grid">
              ${data.suggested_companies.map((company, index) => `
                <div class="company-card">
                  <div class="company-number">${index + 1}</div>
                  <div class="company-name">${company}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        addMessage({
          text: companiesHtml,
          type: 'bot',
          isHtml: true
        });
      }

      // Actualizar el estado
      setPhase3Data(prev => ({
        ...prev,
        supplyChainPerspective: isSupplyChainInterested,
        supplyChainCompanies: isSupplyChainInterested ? (data.suggested_companies || []) : [],
        supplyChainTotalMatches: isSupplyChainInterested ? (data.total_matches || 0) : 0,
        supplyChainUniqueCompanies: isSupplyChainInterested ? (data.unique_companies || 0) : 0,
        evaluationSections: {
          ...prev.evaluationSections,
          selected_categories: {
            ...prev.evaluationSections.selected_categories,
            supply_chain: isSupplyChainInterested // Activar solo si la respuesta es afirmativa
          }
        }
      }));

      // Continuar con las preguntas de evaluación
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleEvaluationQuestions();
    }
  } catch (error) {
    console.error('❌ Error en handleSupplyChainExperienceResponse:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};



//////////////////////////////////////////////////////////EVALUATION QUESTION


const handleEvaluationQuestions = async () => {
  try {
    // Actualizar a fase 3
    setCurrentPhase(3);  // Añadir esta línea
    
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage
    };

    const response = await fetch('http://localhost:8080/api/evaluation-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      setCurrentStep('evaluation_questions');
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};


const handleEvaluationQuestionsResponse = async (answer) => {
  console.log('=== Starting handleEvaluationQuestionsResponse ===');
  try {
    // Primera llamada para confirmar sí/no
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage
    };
    console.log('Sending request:', requestBody);

    const response = await fetch('http://localhost:8080/api/evaluation-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Response received:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      if (data.evaluation_required && data.answer_received === 'yes') {
        setPhase3Data(prev => ({
          ...prev,
          evaluationRequired: true
        }));
        
        // Si la respuesta es sí, iniciar las secciones
        await startEvaluationSections();
      } else {
        // Si la respuesta es no, continuar con la búsqueda
        await searchIndustryExperts();
      }
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }





};


const startEvaluationSections = async () => {
  console.log('=== Starting Evaluation Sections ===');
  try {
    // Actualizar selected_categories basado en las perspectivas
    const requestBody = {
      sector: phase2Data.sector,
      region: phase2Data.processed_region,
      selected_categories: {
        main: true, // Siempre true
        client: phase3Data.clientPerspective, // Basado en la respuesta del usuario
        supply_chain: phase3Data.supplyChainPerspective // Basado en la respuesta del usuario
      },
      current_questions: {},
      language: userData.detectedLanguage
    };
    console.log('Initial sections request:', requestBody);

    const response = await fetch('http://localhost:8080/api/evaluation-questions-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Initial sections response:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      setPhase3Data(prev => {
        const newState = {
          ...prev,
          evaluationRequired: true,
          evaluationSections: {
            current: data.current_category,
            remaining: data.remaining_categories,
            completed: data.completed_categories,
            questions: {},
            selected_categories: {
              main: true,
              client: prev.clientPerspective,
              supply_chain: prev.supplyChainPerspective
            }
          }
        };
        console.log('Updated phase3Data:', newState);
        return newState;
      });
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error al iniciar las preguntas de evaluación.',
      type: 'bot',
      isError: true
    });
  }
};

const handleEvaluationQuestionsSectionsResponse = async (answer) => {
  console.log('=== Processing Section Response ===');
  try {
    const requestBody = {
      sector: phase2Data.sector,
      region: phase2Data.processed_region,
      selected_categories: {
        main: true,
        client: phase3Data.clientPerspective,
        supply_chain: phase3Data.supplyChainPerspective
      },
      current_category: phase3Data.evaluationSections.current,
      answer: answer,
      current_questions: {
        ...phase3Data.evaluationSections.questions,
        [phase3Data.evaluationSections.current]: answer
      },
      clientPerspective: phase3Data.clientPerspective,
      supplyChainPerspective: phase3Data.supplyChainPerspective,
      language: userData.detectedLanguage
    };
    
    console.log('Section response request:', requestBody);
    console.log('Current perspectives - Client:', phase3Data.clientPerspective, 
                'Supply Chain:', phase3Data.supplyChainPerspective);

    const response = await fetch('http://localhost:8080/api/evaluation-questions-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Section response:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      if (data.status === 'completed') {
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            ...prev.evaluationSections,
            completed: Object.keys(data.screening_questions),
            questions: data.screening_questions,
            current: null,
            remaining: []
          }
        }));
        await searchIndustryExperts();
      } else {
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            ...prev.evaluationSections,
            current: data.current_category,
            remaining: data.remaining_categories,
            completed: data.completed_categories,
            questions: data.current_questions,
            selected_categories: {
              main: true,
              client: prev.clientPerspective,
              supply_chain: prev.supplyChainPerspective
            }
          }
        }));
      }
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};



const searchIndustryExperts = async () => {
  try {
    const requestBody = {
      sector: phase2Data.sector,
      region: phase2Data.processed_region.region,
      companies: phase2Data.companies || [],
      clientPerspective: phase3Data.clientPerspective || false,
      supplyChainRequired: phase3Data.supplyChainRequired || false,
      language: userData.detectedLanguage || 'en'
    };

    console.log('🔍 Search Data:', requestBody);

    const response = await fetch('http://localhost:8080/api/industry-experts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('✅ Response received:', data);

    const hasExperts = data.experts && (
      (data.experts.main?.experts?.length > 0) ||
      (data.experts.client?.experts?.length > 0) ||
      (data.experts.supply_chain?.experts?.length > 0)
    );

    if (data.success && hasExperts) {
      let detailedMessage = `
        <div class="experts-container">
          <h3 class="experts-title">${data.messages.experts_found_title}</h3>
      `;

      if (data.experts.main?.experts?.length > 0) {
        detailedMessage += `
          <div class="experts-section">
            <h4 class="section-title">${data.messages.main_experts_title}</h4>
            <div class="experts-grid">
              ${data.experts.main.experts.map(expert => formatExpertInfo(expert)).join('')}
            </div>
          </div>
        `;
      }

      if (phase3Data.clientPerspective && data.experts.client?.experts?.length > 0) {
        detailedMessage += `
          <div class="experts-section">
            <h4 class="section-title">${data.messages.client_experts_title}</h4>
            <div class="experts-grid">
              ${data.experts.client.experts.map(expert => formatExpertInfo(expert)).join('')}
            </div>
          </div>
        `;
      }

      if (phase3Data.supplyChainRequired && data.experts.supply_chain?.experts?.length > 0) {
        detailedMessage += `
          <div class="experts-section">
            <h4 class="section-title">${data.messages.supply_chain_experts_title}</h4>
            <div class="experts-grid">
              ${data.experts.supply_chain.experts.map(expert => formatExpertInfo(expert)).join('')}
            </div>
          </div>
        `;
      }

      detailedMessage += `</div>`;

      // Mostrar lista de expertos
      addMessage({
        text: detailedMessage,
        type: 'bot',
        isHtml: true
      });

      // Actualizar estado con los expertos encontrados
      setPhase3Data(prev => ({
        ...prev,
        selectedExperts: {
          companies: data.experts.main?.experts || [],
          clients: data.experts.client?.experts || [],
          suppliers: data.experts.supply_chain?.experts || []
        },
        totalMatches: data.total_experts_found || 0,
        uniqueCompanies: data.total_experts_shown || 0,
        filtersApplied: {
          detected_language: userData.detectedLanguage
        }
      }));

      // Agregar mensaje de instrucciones para selección
      setTimeout(() => {
        const exampleName = data.experts.main?.experts[0]?.name || 'Alessandro Nielsen';
        const selectionMessage = `
          <div class="selection-prompt">
            <p>${data.messages.selection_instructions}</p>
            <p class="example">${data.messages.selection_example.replace('{expert_name}', exampleName)}</p>
            <p>${data.messages.selection_prompt}</p>
          </div>
        `;

        addMessage({
          text: selectionMessage,
          type: 'bot',
          isHtml: true
        });

        setCurrentStep('expert_selection');
      }, 1000);

    } else {
      console.log('No experts found:', data);
      throw new Error(data.message || 'No experts found matching the specified criteria');
    }
  } catch (error) {
    console.error('❌ Error searching experts:', error);
    addMessage({
      text: error.message || 'Error searching experts. Please try again.',
      type: 'bot',
      isError: true
    });
  }
};

const formatExpertInfo = (expert) => {
  // También podríamos recibir las etiquetas traducidas desde el backend
  return `
    <div class="expert-card">
      <div class="expert-header">
        <span class="expert-name">${expert.name}</span>
      </div>
      <div class="expert-details">
        <div class="detail-item">
          <span class="detail-label">Current Role</span>
          <span class="detail-value">${expert.current_role}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Company</span>
          <span class="detail-value">${expert.current_employer}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Experience</span>
          <span class="detail-value">${expert.experience}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Location</span>
          <span class="detail-value">${expert.location}</span>
        </div>
      </div>
    </div>
  `;
};

const handleExpertSelection = async (expertNames) => {
  try {
    const selectedExperts = expertNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (!phase3Data?.selectedExperts) {
      throw new Error('No experts data available');
    }

    const requestBody = {
      selected_experts: selectedExperts,
      all_experts_data: {
        experts: {
          main: { experts: phase3Data.selectedExperts.companies || [] },
          client: { experts: phase3Data.selectedExperts.clients || [] },
          supply_chain: { experts: phase3Data.selectedExperts.suppliers || [] }
        }
      },
      evaluation_questions: phase3Data?.evaluationSections?.questions || {}
    };

    console.log('Request data:', requestBody);

    const response = await fetch('http://localhost:8080/api/select-experts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.success) {
      if (data.expert_details && data.expert_details.length > 0) {
        const expert = data.expert_details[0];
        const expertHtml = `
          <div class="selected-expert-container">
            <div class="expert-selection-header"></div>
            <div class="selected-expert-card">
              <div class="expert-main-info">
                <h4 class="expert-name">${expert.name}</h4>
                <span class="expert-category">${expert.category}</span>
              </div>
              <div class="expert-info-grid">
                <div class="info-item">
                  <span class="info-label">Current Role</span>
                  <span class="info-value">${expert.current_role}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Company</span>
                  <span class="info-value">${expert.current_employer}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Experience</span>
                  <span class="info-value">${expert.experience}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Location</span>
                  <span class="info-value">${expert.location}</span>
                </div>
              </div>
            </div>
          </div>
        `;
        addMessage({ text: expertHtml, type: 'bot', isHtml: true });
      }

      if (data.screening_questions) {
        const questionsHtml = `
          <div class="screening-questions-container">
            <div class="questions-header">
              <h3>Screening Questions</h3>
            </div>
            <div class="questions-list">
              ${Object.entries(data.screening_questions)
                .map(([category, questions]) => {
                  const categoryLabels = {
                    main: 'MAIN COMPANIES',
                    client: 'CLIENT COMPANIES',
                    supply_chain: 'SUPPLY CHAIN COMPANIES'
                  };
                  
                  return `
                    <div class="question-category">
                      <h4 class="category-title">${categoryLabels[category]}</h4>
                      <div class="question-item">${questions}</div>
                    </div>
                  `;
                }).join('')}
            </div>
          </div>
        `;
        addMessage({ text: questionsHtml, type: 'bot', isHtml: true });
      }

      const finalMessageHtml = `
        <div class="final-message-container">
          <div class="final-message">
            <i class="message-icon">✓</i>
            <p>${data.final_message}</p>
          </div>
        </div>
      `;
      addMessage({ text: finalMessageHtml, type: 'bot', isHtml: true });

    } else {
      throw new Error(data.message || 'Error selecting experts');
    }

  } catch (error) {
    console.error('Error in handleExpertSelection:', error);
    addMessage({
      text: error.message,
      type: 'bot',
      isError: true
    });
  }
};






const handleSendMessage = async (data) => {
  try {
    console.log('=== Starting handleSendMessage ===');
    console.log('Input data:', {
      currentPhase,
      currentStep,
      messageData: data,
      phase3Data: phase3Data
    });

    setLoading(true);

    if (data.type === 'error') {
      console.log('=== Handling Error Message ===');
      addMessage({
        text: data.value,
        type: 'bot',
        isError: true
      });
      return;
    }

    const userMessage = data.value;
    addMessage({ text: userMessage, type: 'user' });

    // Manejar evaluation_questions en fase 3
    if (currentStep === 'evaluation_questions') {
      setCurrentPhase(3);
      
      if (!phase3Data.evaluationRequired) {
        // Primera vez, manejando la pregunta inicial de sí/no
        console.log('=== Processing Initial Evaluation Question ===');
        await handleEvaluationQuestionsResponse(userMessage);
      } else {
        // Ya confirmó que quiere evaluación, usar el endpoint de secciones
        console.log('=== Processing Evaluation Sections ===');
        await handleEvaluationQuestionsSectionsResponse(userMessage);
      }
      return;
    }

    // Resto de las fases
    if (currentPhase === 1) {
      console.log('=== Processing Phase 1 ===');
      switch (currentStep) {
        case 'email':
          await handleEmailCapture(userMessage);
          break;
        case 'name':
          await handleNameCapture(userMessage);
          break;
        case 'expert_connection':
          await handleExpertConnection(userMessage);
          break;
        default:
          console.log('Warning: Unknown step in Phase 1:', currentStep);
          break;
      }
    } else if (currentPhase === 2) {
      console.log('=== Processing Phase 2 ===');
      switch (currentStep) {
        case 'sector_selection':
        case 'sector':
          await handleSectorSelection(userMessage);
          break;
        case 'region':
          await handleRegionInput(userMessage);
          break;
        case 'companies':
          await handleCompaniesInput(userMessage);
          break;
        case 'exclude_companies':
          await handleExcludeCompaniesResponse(userMessage);
          break;
        case 'client_perspective':
          await handleClientPerspectiveResponse(userMessage);
          break;
        case 'supply_chain_experience':
          await handleSupplyChainExperienceResponse(userMessage);
          break;
        case 'next_step':
          await handleCompanyAgreement(userMessage);
          break;
        case 'employment_status':
          await handleEmploymentStatusResponse(userMessage);
          break;
        default:
          console.warn('Unknown step in Phase 2:', currentStep);
          break;
      }
    } else if (currentPhase === 3) {
      console.log('=== Processing Phase 3 ===');
      switch (currentStep) {
        case 'expert_search':
          await searchIndustryExperts();
          break;
        case 'expert_selection':
          await handleExpertSelection(userMessage);
          break;
        default:
          console.warn('Unknown step in Phase 3:', currentStep);
          break;
      }
    }

    console.log('=== State After Processing ===');
    console.log('Current phase:', currentPhase);
    console.log('Current step:', currentStep);
    console.log('Phase3Data:', phase3Data);

  } catch (error) {
    console.error('=== Error in handleSendMessage ===');
    console.error('Error details:', error);
    console.error('State at error:', {
      phase: currentPhase,
      step: currentStep,
      phase3Data: phase3Data
    });
    
    addMessage({
      text: error.message || "Lo siento, hubo un error procesando tu solicitud.",
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false);
    console.log('=== Finished handleSendMessage ===');
    console.log('Final step:', currentStep);
    console.log('Final phase3Data:', phase3Data);
  }
};

// Actualizar isInputDisabled para incluir los nuevos pasos
const isInputDisabled = () => {
  const allowedSteps = [
    'employment_status',
    'expert_selection',
    'expert_preferences',
    'final_confirmation',
    'sector_selection',
    'region',
    'companies',
    'next_step',
    'request_new_list',
    'email',
    'name',
    'expert_connection',
    'exclude_companies',
    'client_perspective',
    'supply_chain_experience',
    'evaluation_questions',
    'evaluation_sections',
    'expert_search',
  ];

  return loading || 
         (currentStep === 'complete' && !phase3Data.currentExpertStep) || 
         !allowedSteps.includes(currentStep);
};



return (
  <div className="chat-container">
    <div className="chat-header">
      <div className="phase-indicator">
        Phase {currentPhase}
      </div>
    </div>
    
    <div className="chat-messages">
      {messages.map((message, index) => (
        <ChatMessage 
          key={index}
          text={message.text}
          type={message.type}
        />
      ))}

      {loading && <div className="loading">Processing your request...</div>}
    </div>

    <ChatInput 
      onSendMessage={handleSendMessage}
      disabled={isInputDisabled()}
      currentStep={currentStep}
      currentPhase={currentPhase}
     
    />
  </div>
);
}

export default Chat