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
    evaluationRequired: false,
    evaluationSections: {
      current: null,
      remaining: [],
      completed: [],
      questions: {},
      selected_categories: {
        main: true,
        client: true,
        supply_chain: false
      }
    },
  
    // Estados para empresas y perspectivas
    clientCompanies: [],
    clientPerspective: false,
    supplyChainCompanies: [],
    supplyChainPerspective: false,
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

    // Agregar log para ver qué está llegando
    console.log('Response data:', data);

    if (data.success && Array.isArray(data.companies)) { // Verificar que companies es un array
      setPhase2Data(prev => ({
        ...prev,
        companies: data.companies
      }));

      // Crear la lista de compañías solo si hay compañías
      const companiesList = data.companies.length > 0 
        ? data.companies.map((company, index) => 
            `${index + 1}. ${company}`
          ).join('\n')
        : 'No companies found.';

      // Extraer el mensaje base (con validación)
      const baseMessage = data.message?.split('\n\n')[0] || 'Company suggestions received';
      
      // Construir el mensaje final
      const fullMessage = `${baseMessage}\n\n${companiesList}\n\n`;

      addMessage({
        text: fullMessage,
        type: 'bot'
      });

      setCurrentStep('next_step');
    } else {
      // Mensaje más específico sobre el error
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

      // Mensaje con resumen de empresas
      if (data.suggested_companies?.length > 0) {
        const companiesMessage = `Suggested companies: ${data.suggested_companies.join(', ')}`;
        addMessage({
          text: companiesMessage,
          type: 'bot'
        });
      }

      // Mensaje con resumen de coincidencias
      if (data.total_matches > 0) {
        const matchesMessage = `Found ${data.total_matches} experts from ${data.unique_companies} companies.`;
        addMessage({
          text: matchesMessage,
          type: 'bot'
        });
      }

      // Actualizar estado
      setPhase3Data(prev => ({
        ...prev,
        clientPerspective: data.client_perspective || false,
        clientCompanies: data.suggested_companies || [],
        totalMatches: data.total_matches || 0,
        uniqueCompanies: data.unique_companies || 0
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

// 2. Función para manejar la respuesta del usuario
const handleSupplyChainExperienceResponse = async (answer) => {
  console.log('🔍 Estado actual antes de supply chain:', phase3Data);
  console.log('📥 Respuesta supply chain:', answer);
  
  try {
    const requestBody = {
      answer: answer,
      sector: phase3Data.sector,    // Incluir sector
      region: phase3Data.region,    // Incluir región
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

      // Mensaje con resumen de empresas
      if (data.suggested_companies?.length > 0) {
        const companiesMessage = `Suggested supply chain companies: ${data.suggested_companies.join(', ')}`;
        addMessage({
          text: companiesMessage,
          type: 'bot'
        });
      }

      // Mensaje con resumen de coincidencias
      if (data.total_matches > 0) {
        const matchesMessage = `Found ${data.total_matches} experts from ${data.unique_companies} supply chain companies.`;
        addMessage({
          text: matchesMessage,
          type: 'bot'
        });
      }

      // Actualizar el estado
      setPhase3Data(prev => ({
        ...prev,
        supplyChainPerspective: data.supply_chain_perspective || false,
        supplyChainCompanies: data.suggested_companies || [],
        supplyChainTotalMatches: data.total_matches || 0,
        supplyChainUniqueCompanies: data.unique_companies || 0
      }));

      // Continuar con las preguntas de evaluación
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleEvaluationQuestions();
      
      console.log('✅ Supply chain data guardada:', {
        perspective: data.supply_chain_perspective,
        companies: data.suggested_companies?.length,
        matches: data.total_matches
      });
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
  console.log('Starting handleEvaluationQuestionsResponse with:', answer);
  try {
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage
    };
    console.log('Sending request to backend:', requestBody);

    const response = await fetch('http://localhost:8080/api/evaluation-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      console.log('Updating phase3Data');
      setPhase3Data(prev => {
        const newState = {
          ...prev,
          evaluationRequired: data.evaluation_required
        };
        console.log('New phase3Data:', newState);
        return newState;
      });

      if (data.evaluation_required && data.answer_received === 'yes') {
        console.log('Starting evaluation sections');
        await handleEvaluationQuestionsSections();
      }
    }
  } catch (error) {
    console.error('Error in handleEvaluationQuestionsResponse:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};










const handleEvaluationQuestionsSections = async () => {
  console.log('=== Starting Evaluation Sections ===');
  try {
    const requestBody = {
      sector: userData.sector,
      region: userData.region,
      selected_categories: phase3Data.evaluationSections.selected_categories,
      current_questions: {},
      language: userData.detectedLanguage
    };

    console.log('Sending request:', requestBody);
    const response = await fetch('http://localhost:8080/api/evaluation-questions-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Received response:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      setPhase3Data(prev => ({
        ...prev,
        evaluationSections: {
          ...prev.evaluationSections,
          current: data.current_category,
          remaining: data.remaining_categories || [],
          completed: data.completed_categories || []
        }
      }));
    }
  } catch (error) {
    console.error('Error in evaluation sections:', error);
    addMessage({
      text: 'Error al procesar las preguntas de evaluación.',
      type: 'bot',
      isError: true
    });
  }
};

const handleEvaluationQuestionsSectionsResponse = async (answer) => {
  try {
    const requestBody = {
      sector: userData.sector,
      region: userData.region,
      selected_categories: {
        main: true,
        client: true,
        supply_chain: false
      },
      current_category: phase3Data.evaluationSections.current,
      answer: answer,
      current_questions: {
        ...phase3Data.evaluationSections.questions,
        [phase3Data.evaluationSections.current]: answer
      },
      language: userData.detectedLanguage
    };

    const response = await fetch('http://localhost:8080/api/evaluation-questions-sections', {
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

      if (data.status === 'completed') {
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            ...prev.evaluationSections,
            questions: {
              ...prev.evaluationSections.questions,
              [phase3Data.evaluationSections.current]: answer
            }
          }
        }));
        await searchIndustryExperts();
      } else {
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            current: data.current_category,
            remaining: data.remaining_categories,
            completed: data.completed_categories,
            questions: {
              ...prev.evaluationSections.questions,
              [phase3Data.evaluationSections.current]: answer
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
      processed_region: phase2Data.processed_region,
      language: phase2Data.language,
      companies: phase2Data.companies,
      interested_in_companies: phase2Data.interested_in_companies,
      employmentStatus: phase3Data.employmentStatus,
      companiesForExpertSearch: phase3Data.companiesForExpertSearch,
      excludedCompanies: phase3Data.excludedCompanies,
      clientPerspective: phase3Data.clientPerspective,
      supplyChainRequired: phase3Data.supplyChainRequired
    };

    console.log('🔍 Búsqueda de expertos - Datos enviados:', requestBody);

    const response = await fetch('http://localhost:8080/api/industry-experts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('✅ Búsqueda de expertos - Respuesta recibida:', data);

    if (data.success) {
      const { experts_by_category, total_experts, detected_language } = data;

      if (total_experts > 0) {
        let detailedMessage = '';

        const formatExpertInfo = (expert) => {
          return `- ${expert.name} (${expert.role})
             • ${expert.experience}
             • ${expert.companies_experience.join(', ')}
             • ${expert.expertise.join(', ')}
             • ${expert.region_experience.join(', ')}`;
        };

        const categories = ['companies', 'clients', 'suppliers'];
        categories.forEach(category => {
          const categoryExperts = experts_by_category[category].experts;
          if (categoryExperts && categoryExperts.length > 0) {
            detailedMessage += `\n\n${experts_by_category[category].title}:\n`;
            categoryExperts.forEach(expert => {
              detailedMessage += `\n${formatExpertInfo(expert)}`;
            });
          }
        });

        if (detailedMessage) {
          addMessage({
            text: detailedMessage.trim(),
            type: 'bot'
          });
          
          setTimeout(() => {
            addMessage({
              text: data.selection_message,
              type: 'bot'
            });
            setCurrentPhase(3);
            setCurrentStep('expert_selection');
          }, 1000);
        }

        setPhase3Data(prev => ({
          ...prev,
          selectedExperts: {
            clients: experts_by_category.clients.experts,
            companies: experts_by_category.companies.experts,
            suppliers: experts_by_category.suppliers.experts
          },
          filtersApplied: {
            ...data.filters_applied,
            detected_language: detected_language
          },
          experts_by_category: {
            clients: {
              experts: experts_by_category.clients.experts
            },
            companies: {
              experts: experts_by_category.companies.experts
            },
            suppliers: {
              experts: experts_by_category.suppliers.experts
            }
          },
          detected_language: detected_language
        }));
      }
    } else {
      throw new Error('No se pudieron encontrar expertos que coincidan con los criterios especificados');
    }
  } catch (error) {
    console.error('❌ Error en búsqueda de expertos:', error);
    addMessage({
      text: 'Error al buscar expertos. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};
///////////////////////////////////////////////////////////////////7



const handleExpertSelection = async (expertNames) => {
  try {
    const selectedExperts = expertNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (!phase3Data?.selectedExperts) {
      throw new Error('No hay datos de expertos disponibles');
    }

    const requestBody = {
      selected_experts: selectedExperts,
      all_experts_data: {
        detected_language: phase3Data.filtersApplied?.detected_language || 'en',
        experts_by_category: {
          clients: { experts: phase3Data.selectedExperts.clients || [] },
          companies: { experts: phase3Data.selectedExperts.companies || [] },
          suppliers: { experts: phase3Data.selectedExperts.suppliers || [] }
        }
      },
      evaluation_questions: phase3Data?.evaluationSections?.questions || {}
    };

    console.log('Datos enviados para selección:', requestBody);

    const response = await fetch('http://localhost:8080/api/select-experts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.success) {
      if (data.expert_details) {
        setTimeout(() => {
          const expert = data.expert_details;
          const detailsMessage = `📋\n\n` +
            `${expert.name}\n` +
            `• ${expert.role}\n` +
            `• ${expert.experience}\n` +
            `• ${expert.companies_experience.join(', ')}\n` +
            `• ${expert.expertise.join(', ')}\n` +
            `• ${expert.region_experience.join(', ')}`;

          addMessage({
            text: detailsMessage,
            type: 'bot'
          });
        }, 1000);
      }

      if (data.evaluation_questions && Object.keys(data.evaluation_questions).length > 0) {
        setTimeout(() => {
          let questionsMessage = `📝 Preguntas sugeridas para la evaluación:\n\n`;
          
          Object.entries(data.evaluation_questions).forEach(([section, questions]) => {
            questionsMessage += `${section.toUpperCase()}:\n${questions}\n\n`;
          });

          addMessage({
            text: questionsMessage,
            type: 'bot'
          });
        }, 2000);
      }

      if (data.final_message) {
        setTimeout(() => {
          addMessage({
            text: data.final_message,
            type: 'bot'
          });
        }, 3000);
      }

    } else {
      throw new Error(data.message || 'Error al seleccionar expertos');
    }

  } catch (error) {
    console.error('Error en handleExpertSelection:', error);
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

    // Manejar mensajes de error
    if (data.type === 'error') {
      console.log('=== Handling Error Message ===');
      console.log('Error value:', data.value);
      addMessage({
        text: data.value,
        type: 'bot',
        isError: true
      });
      return;
    }

    const userMessage = data.value;
    console.log('User message:', userMessage);
    
    addMessage({ text: userMessage, type: 'user' });

    console.log('=== Current State ===');
    console.log('Phase:', currentPhase);
    console.log('Step:', currentStep);
    console.log('Phase3Data:', phase3Data);

    // Manejar evaluation_questions y evaluation_sections en fase 3
    if (currentStep === 'evaluation_questions' || currentStep === 'evaluation_sections') {
      setCurrentPhase(3);  // Asegurar que estamos en fase 3
      
      if (currentStep === 'evaluation_questions') {
        console.log('=== Processing Evaluation Questions in Phase 3 ===');
        await handleEvaluationQuestionsResponse(userMessage);
      } else {
        console.log('=== Processing Evaluation Sections in Phase 3 ===');
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