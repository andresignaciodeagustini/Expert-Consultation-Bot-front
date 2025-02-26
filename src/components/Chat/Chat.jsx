import { useState } from 'react'
import './Chat.css'
import ChatInput from '../ChatInput/ChatInput'
import ChatMessage from '../ChatMessage/ChatMessage'

function Chat() {
  const [messages, setMessages] = useState([
    {
      text: "Welcome! Please enter your email:", 
      type: 'bot'
    }
  ])
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
    employmentStatus: '',
    excludedCompanies: [],
    clientPerspective: '',
    supplyChainRequired: '',
    evaluationQuestions: '',
    evaluationSections: {
      current: null,
      remaining: [],
      completed: [],
      questions: {}
    }
  });
  








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
  
      if (data.success) {
        setPhase2Data(prev => ({
          ...prev,
          companies: data.companies
        }));
  
        // Crear la lista de compañías
        const companiesList = data.companies.map((company, index) => 
          `${index + 1}. ${company}`
        ).join('\n');
  
        // Extraer el mensaje base (sin la pregunta de confirmación)
        const baseMessage = data.message.split('\n\n')[0];
        
        // Construir el mensaje final en el orden correcto
        const fullMessage = `${baseMessage}\n\n${companiesList}\n\n`;
  
        addMessage({
          text: fullMessage,
          type: 'bot'
        });
  
        setCurrentStep('next_step');
      } else {
        addMessage({
          text: data.message || 'Error getting company suggestions',
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


















/////////////////////////////////////FASE3/////////////////////////////////////////////////////






// Primera función - solo muestra la pregunta
const handleEmploymentStatus = async () => {
  try {
    setLoading(true);
    
    const response = await fetch('http://localhost:8080/api/specify-employment-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: userData.detectedLanguage
      })
    });

    const data = await response.json();

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      setCurrentStep('employment_status');
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false);
  }
};

// Segunda función - procesa la respuesta y actualiza el estado
const handleEmploymentStatusResponse = async (status) => {
  try {
    setLoading(true);

    const response = await fetch('http://localhost:8080/api/specify-employment-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: status,
        language: userData.detectedLanguage
      })
    });

    const data = await response.json();

    if (data.success) {
      // Actualizar el estado
      setPhase3Data(prev => ({
        ...prev,
        employmentStatus: data.employment_status
      }));
      
      // Opcional: si quieres mostrar el mensaje de confirmación
      addMessage({
        text: data.message,
        type: 'bot'
      });
      
      // Continuar con el siguiente paso
      setTimeout(() => {
        handleExcludeCompanies();
      }, 1000);
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false);
  }
};


///////////////////////////EXCLUDE COMPANIES/////////////////////////////////77

const handleExcludeCompanies = async () => {
  console.log('Iniciando handleExcludeCompanies');
  try {
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage
    };
    console.log('Enviando solicitud a exclude-companies:', requestBody);

    const response = await fetch('http://localhost:8080/api/exclude-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de exclude-companies:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      console.log('Actualizando currentStep a exclude_companies');
      setCurrentStep('exclude_companies');
    }
  } catch (error) {
    console.error('Error en handleExcludeCompanies:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
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
    console.log('Enviando solicitud de respuesta a exclude-companies:', requestBody);

    const response = await fetch('http://localhost:8080/api/exclude-companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de exclude-companies response:', data);

    if (data.success) {
      console.log('✅ Estado después de excluir compañías:', {
        excludedCompanies: data.excluded_companies,
        phase3DataActual: phase3Data
      });
      
      addMessage({
        text: data.message,
        type: 'bot'
      });
      
      console.log('Actualizando phase3Data con excluded_companies:', data.excluded_companies);
      setPhase3Data(prev => {
        const newState = {
          ...prev,
          excludedCompanies: data.excluded_companies || []
        };
        console.log('Nuevo estado de phase3Data:', newState);
        return newState;
      });

      console.log('Llamando a handleClientPerspective');
      await handleClientPerspective();
    }
  } catch (error) {
    console.error('Error en handleExcludeCompaniesResponse:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  }
};





/////////////////////////////////////CLIENT PERSPECTIVE

const handleClientPerspective = async () => {
  console.log('Iniciando handleClientPerspective');
  try {
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage
    };
    console.log('Enviando solicitud a client-perspective:', requestBody);

    const response = await fetch('http://localhost:8080/api/client-perspective', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de client-perspective:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      console.log('Actualizando currentStep a client_perspective');
      setCurrentStep('client_perspective');
    }
  } catch (error) {
    console.error('Error en handleClientPerspective:', error);
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
  console.log('Iniciando handleClientPerspectiveResponse con respuesta:', answer);
  try {
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage
    };
    console.log('Enviando solicitud de respuesta a client-perspective:', requestBody);

    const response = await fetch('http://localhost:8080/api/client-perspective', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de client-perspective response:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      
      console.log('✅ Estado después de client perspective:', {
        clientPerspective: data.client_perspective,
        phase3DataActual: phase3Data
      });
      
      console.log('Actualizando phase3Data con client_perspective:', data.client_perspective);
      setPhase3Data(prev => {
        const newState = {
          ...prev,
          clientPerspective: data.client_perspective || ''
        };
        console.log('Nuevo estado de phase3Data:', newState);
        return newState;
      });

      // En lugar de cambiar a next_phase, llamamos a handleSupplyChainExperience
      console.log('Llamando a handleSupplyChainExperience');
      setTimeout(() => {
        handleSupplyChainExperience();
      }, 500);
    }
  } catch (error) {
    console.error('Error en handleClientPerspectiveResponse:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  }
};
////////////////////////////////////////////////////Supply Chain




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
  console.log('Iniciando handleSupplyChainExperienceResponse con respuesta:', answer);
  try {
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage
    };
    console.log('Enviando respuesta a supply-chain-experience:', requestBody);

    const response = await fetch('http://localhost:8080/api/supply-chain-experience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida del servidor:', data);

    if (data.success) {
      console.log('✅ Estado después de supply chain:', {
        supplyChainRequired: data.supply_chain_required,
        phase3DataActual: phase3Data
      });

      addMessage({
        text: data.message,
        type: 'bot'
      });

      // Actualizar el estado con la preferencia de supply chain
      setPhase3Data(prev => ({
        ...prev,
        supplyChainRequired: data.supply_chain_required
      }));

      // Llamar a handleEvaluationQuestions como siguiente paso
      await handleEvaluationQuestions();
      
      console.log('Supply chain preference guardada:', data.supply_chain_required);
    } else {
      throw new Error(data.message || 'Error en la respuesta de supply chain experience');
    }
  } catch (error) {
    console.error('Error en handleSupplyChainExperienceResponse:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};




//////////////////////////////////////////////////////////EVALUATION QUESTION



const handleEvaluationQuestions = async () => {
  console.log('Iniciando handleEvaluationQuestions');
  try {
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage
    };
    console.log('Enviando solicitud inicial a evaluation-questions:', requestBody);

    const response = await fetch('http://localhost:8080/api/evaluation-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de evaluation-questions:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
      setCurrentStep('evaluation_questions');
    } else {
      throw new Error(data.message || 'Error en la solicitud de evaluation questions');
    }
  } catch (error) {
    console.error('Error en handleEvaluationQuestions:', error);
    addMessage({
      text: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};

const handleEvaluationQuestionsResponse = async (answer) => {
  console.log('Iniciando handleEvaluationQuestionsResponse con respuesta:', answer);
  try {
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage
    };
    console.log('Enviando respuesta a evaluation-questions:', requestBody);

    const response = await fetch('http://localhost:8080/api/evaluation-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida del servidor:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      // Actualizar el estado con la preferencia de evaluación
      setPhase3Data(prev => ({
        ...prev,
        evaluationRequired: data.evaluation_required,
        evaluationQuestions: data.evaluation_required === true ? answer : ''
      }));

      // Si el usuario quiere preguntas de evaluación y ya proporcionó su respuesta
      if (data.evaluation_required === true && data.answer_received) {
        console.log('Evaluación inicial completada, procediendo a las secciones de evaluación');
        // Llamar a handleEvaluationQuestionsSections con las secciones predeterminadas
        await handleEvaluationQuestionsSections(['proveedores', 'empresas', 'clientes']);
      } else if (data.evaluation_required === false) {
        console.log('Usuario no requiere evaluación, procediendo al siguiente paso');
        // Aquí puedes agregar la lógica para el siguiente paso cuando no se requiere evaluación
        await searchIndustryExperts();
      }
    } else {
      throw new Error(data.message || 'Error en la respuesta de evaluation questions');
    }
  } catch (error) {
    console.error('Error en handleEvaluationQuestionsResponse:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};



//////////////////////////////////////////////////////evaluation-section





const handleEvaluationQuestionsSections = async (sections = ['proveedores', 'empresas', 'clientes']) => {
  console.log('Iniciando handleEvaluationQuestionsSections');
  try {
    const requestBody = {
      sections: sections,
      language: userData.detectedLanguage,
      questions: {} // Inicialmente vacío
    };
    console.log('Enviando solicitud inicial a evaluation-questions-sections:', requestBody);

    const response = await fetch('http://localhost:8080/api/evaluation-questions-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de evaluation-questions-sections:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      // Guardar el estado actual de las secciones
      setPhase3Data(prev => ({
        ...prev,
        evaluationSections: {
          current: data.current_section,
          remaining: data.remaining_sections,
          completed: data.completed_sections,
          questions: {}
        }
      }));

      setCurrentStep('evaluation_sections');
    } else {
      throw new Error(data.message || 'Error en la solicitud de evaluation sections');
    }
  } catch (error) {
    console.error('Error en handleEvaluationQuestionsSections:', error);
    addMessage({
      text: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};






const handleEvaluationQuestionsSectionsResponse = async (answer) => {
  console.log('Iniciando handleEvaluationQuestionsSectionsResponse con respuesta:', answer);
  try {
    // Obtener el estado actual de las secciones
    const currentSection = phase3Data.evaluationSections.current;
    const updatedQuestions = {
      ...phase3Data.evaluationSections.questions,
      [currentSection]: answer
    };

    const requestBody = {
      sections: [
        currentSection,
        ...phase3Data.evaluationSections.remaining
      ],
      questions: updatedQuestions,
      language: userData.detectedLanguage
    };

    console.log('Enviando respuesta a evaluation-questions-sections:', requestBody);

    const response = await fetch('http://localhost:8080/api/evaluation-questions-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida del servidor:', data);

    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });

      if (data.status === 'completed') {
        // Actualizar el estado con las secciones completadas
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            ...prev.evaluationSections,
            completed: Object.keys(data.sections_with_questions),
            questions: data.sections_with_questions,
            current: null,
            remaining: []
          }
        }));

        console.log('Todas las secciones completadas');
        
        // Iniciar la búsqueda de expertos cuando se completan todas las secciones
        await searchIndustryExperts();
      } else {
        // Actualizar el estado para la siguiente sección
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            current: data.current_section,
            remaining: data.remaining_sections,
            completed: data.completed_sections,
            questions: updatedQuestions
          }
        }));
      }
    } else {
      throw new Error(data.message || 'Error en la respuesta de evaluation sections');
    }
  } catch (error) {
    console.error('Error en handleEvaluationQuestionsSectionsResponse:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  }
};



//////////////////////////////////////////////busqueda de experots

// Función para buscar expertos
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
      const { experts_by_category, total_experts } = data;
      
      // Mensaje inicial con el total de expertos
      const expertsMessage = `Se encontraron ${total_experts} experto${total_experts !== 1 ? 's' : ''} que coinciden con tus criterios.`;
      addMessage({
        text: expertsMessage,
        type: 'bot'
      });

      // Si hay expertos, mostrar los detalles
      if (total_experts > 0) {
        let detailedMessage = '';

        // Función helper para formatear la experiencia del experto
        const formatExpertInfo = (expert) => {
          return `- ${expert.name} (${expert.role})
             • Experiencia: ${expert.experience}
             • Empresas: ${expert.companies_experience.join(', ')}
             • Áreas de expertise: ${expert.expertise.join(', ')}
             • Regiones: ${expert.region_experience.join(', ')}`;
        };

        // Procesar cada categoría
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
        }

        // Actualizar el estado con los expertos encontrados
        setPhase3Data(prev => ({
          ...prev,
          selectedExperts: {
            clients: experts_by_category.clients.experts,
            companies: experts_by_category.companies.experts,
            suppliers: experts_by_category.suppliers.experts
          },
          filtersApplied: data.filters_applied
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



















































//////////////////////////////////////////////////////////////////////77

const handleSendMessage = async (data) => {
  try {
    console.log('Starting handleSendMessage with:', {
      currentPhase,
      currentStep,
      userMessage: data.value
    });

    setLoading(true);
    const userMessage = data.value;
    addMessage({ text: userMessage, type: 'user' });

    console.log('Current Phase and Step:', { currentPhase, currentStep });

    if (currentPhase === 1) {
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
          console.log('Phase 1 - Hit default case with step:', currentStep);
          break;
      }
    } else if (currentPhase === 2) {
      console.log('Processing Phase 2, current step:', currentStep);
      
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
          console.log('Processing client perspective response');
          await handleClientPerspectiveResponse(userMessage);
          break;
        case 'supply_chain_experience':
          console.log('Processing supply chain experience response');
          await handleSupplyChainExperienceResponse(userMessage);
          break;
        case 'evaluation_questions':
          console.log('Processing evaluation questions response');
          await handleEvaluationQuestionsResponse(userMessage);
          break;
        case 'evaluation_sections':
          console.log('Processing evaluation sections response');
          await handleEvaluationQuestionsSectionsResponse(userMessage);
          break;
        case 'next_step':
          console.log('Processing next_step response:', userMessage);
          if (userMessage.toLowerCase() === 'si' || userMessage.toLowerCase() === 'yes') {
            console.log('User agreed, calling handleEmploymentStatus');
            await handleEmploymentStatus();
          } else {
            console.log('User disagreed, generating new list');
            await handleCompanySuggestions();
            setCurrentStep('next_step');
          }
          break;
        case 'employment_status':
          console.log('Processing employment_status response');
          await handleEmploymentStatusResponse(userMessage);
          break;
        default:
          console.log('Phase 2 - Hit default case with step:', currentStep);
          break;
      }
    } else if (currentPhase === 3) {
      console.log('Processing Phase 3, current step:', currentStep);
      switch (currentStep) {
        case 'expert_search':
          await searchIndustryExperts();
          break;
        default:
          console.log('Phase 3 - Hit default case with step:', currentStep);
          break;
      }
    }
  } catch (error) {
    console.error('Error in handleSendMessage:', error);
    addMessage({
      text: "Sorry, there was an error processing your request.",
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false);
    console.log('Finished handleSendMessage, current step is:', currentStep);
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
);
}

export default Chat