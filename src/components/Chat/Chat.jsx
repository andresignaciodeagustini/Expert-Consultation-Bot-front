import { useState, useEffect, useRef } from 'react';
import './Chat.css'
import ChatInput from '../ChatInput/ChatInput'
import ChatMessage from '../ChatMessage/ChatMessage'
import { fetchWithRetry } from '../../utils/fetchWithRetry'; 

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
    specific_area: '', 
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

  const messagesContainerRef = useRef(null);
  
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

  // Función para hacer scroll hasta el fondo del chat
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Ejecutar scrollToBottom cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ejecutar scrollToBottom después de un pequeño retraso para asegurar que el contenido se ha renderizado
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);

// Nuevo useEffect para el mensaje de bienvenida (reemplaza los dos existentes)
useEffect(() => {
  const fetchWelcomeMessage = async () => {
    try {
      console.log('VITE_API_URL Value:', import.meta.env.VITE_API_URL); // Log para ver el valor
      console.log('Fetching welcome message from:', import.meta.env.VITE_API_URL);
      
      const response = await fetchWithRetry(`${import.meta.env.VITE_API_URL}/api/welcome-message`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('Welcome Message Response:', {
        success: data.success,
        country: data.country_code,
        language: data.detected_language,
        isEnglishSpeaking: data.is_english_speaking,
        hasTranslations: !!data.messages?.greeting?.translated
      });
      
      if (data.success) {
        if (data.is_english_speaking) {
          console.log('Setting English-only messages');
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
          console.log('Setting bilingual messages');
          setMessages([
            {
              text: data.messages.greeting.english,
              type: 'bot',
              className: 'chat-message bot'
            },
            {
              text: data.messages.greeting.translated,
              type: 'bot',
              className: 'chat-message bot'
            },
            {
              text: data.messages.instruction.english,
              type: 'bot',
              className: 'chat-message bot'
            },
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
        }));
      }
    } catch (error) {
      console.error('Error fetching welcome message:', error);
      console.error('Error details:', error.message);
      // ... manejo de error
    }
  };

  fetchWelcomeMessage();
}, []);


const handleEmailCapture = async (email) => {
  try {
    console.log('Capturando email:', email);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/email/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, text: email })
    })
    
    console.log('Respuesta del servidor:', response);
    const data = await response.json()
    console.log('Datos procesados:', data);
    
    if (data.success) {
      console.log('Email procesado con éxito');
      setUserData(prev => ({
        ...prev,
        email,
        isRegistered: data.is_registered,
        detectedLanguage: data.detected_language
      }))
      
      console.log('Añadiendo mensaje:', data.message);
      addMessage({ text: data.message, type: 'bot' })
      
      console.log('Cambiando paso a name');
      setCurrentStep('name')
    } else {
      // Manejar el error cuando el email no es válido
      console.log('Email inválido o error:', data.error);
      addMessage({ text: data.error, type: 'bot' })
      // No cambiamos el currentStep, seguimos en 'email'
    }
  } catch (error) {
    console.error('Error procesando email:', error)
    addMessage({ 
      text: `Error processing email: ${error.message}`, 
      type: 'bot', 
      isError: true 
    })
  }
}
const handleNameCapture = async (name) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/name/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: name,
        is_registered: userData.isRegistered
      })
    });

    const data = await response.json();
    console.log('Name capture full response:', data);

    if (data.success) {
      setUserData(prev => ({ ...prev, name }));
      addMessage({ 
        text: data.message, 
        type: data.type || 'bot',
        options: data.options,
        detected_language: data.detected_language,
        step: data.step,
        next_action: data.next_action,
        isError: data.isError || false
      });
      setCurrentStep('expert_connection');
    } else {
      // Manejar la respuesta de error del backend
      addMessage({ 
        text: data.message || data.error || 'Error processing name', 
        type: data.type || 'bot', 
        isError: true,
        error_type: data.error_type,
        detected_language: data.detected_language
      });
      
      // Si hay un tipo de error específico, podemos manejarlo de forma diferente
      if (data.error_type === 'invalid_name_format') {
        console.warn('Invalid name format detected');
        // Aquí podrías agregar lógica adicional específica para este tipo de error
        // Por ejemplo, resaltar el campo de entrada, mostrar un tooltip, etc.
      }
    }
  } catch (error) {
    console.error('Detailed error processing name:', error);
    
    // Mostrar mensaje de error para problemas de conexión o excepciones no manejadas
    addMessage({ 
      text: `Error: ${error.message}`, 
      type: 'bot', 
      isError: true 
    });
  }
};




const handleExpertConnection = async (answer) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/expert-connection/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: answer,
        name: userData.name,
        detected_language: userData.detectedLanguage,
        previous_step: 'ask_expert_connection'
      })
    });

    const data = await response.json();
    console.log('Expert connection response:', data);
    
    // Actualizar el idioma detectado si está disponible
    if (data.detected_language) {
      setUserData(prev => ({ 
        ...prev, 
        detectedLanguage: data.detected_language 
      }));
    }
    
    // Agregar la respuesta al chat (tanto para éxito como para error)
    addMessage({ 
      text: data.message || data.error, 
      type: data.type || 'bot',
      options: data.options,
      isError: data.isError || false,
      detected_language: data.detected_language
    });
    
    if (data.success) {
      // Manejar diferentes pasos según la respuesta exitosa
      if (data.step === 'select_sector') {
        setCurrentPhase(2);
        setCurrentStep('sector_selection');
      } else if (data.step === 'farewell') {
        setCurrentStep('complete');
      } else if (data.step === 'clarify') {
        // Mantener el mismo paso para que el usuario pueda intentar nuevamente
        // No cambiamos el paso actual
      }
    } else {
      // Manejar respuesta de error
      if (data.error_type === 'invalid_response_format' || data.error_type === 'unclear_intention') {
        console.warn(`Invalid response detected: ${data.error_type}`);
        // Mostrar opciones nuevamente - ya están incluidas en el mensaje
        // No cambiamos el paso actual para permitir otro intento
      }
    }
  } catch (error) {
    console.error('Error in expert connection:', error);
    addMessage({ 
      text: `Error: ${error.message}`, 
      type: 'bot', 
      isError: true 
    });
  }
};
///////////////////////////////////////////////////////////////////////////////////////adfgsdfg






const handleSectorSelection = async (sector) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sector-experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sector,
        name: userData.name,
        language: userData.detectedLanguage
      })
    });
    
    const data = await response.json();
    console.log('Sector selection response:', data);
    
    // Actualizar el idioma detectado si está disponible
    if (data.detected_language) {
      setUserData(prev => ({ 
        ...prev, 
        detectedLanguage: data.detected_language 
      }));
    }
    
    if (data.success) {
      // Guardar el sector seleccionado
      setPhase2Data(prev => ({ ...prev, sector }));
      
      // Añadir mensaje de respuesta
      addMessage({ 
        text: data.message, 
        type: data.type || 'bot',
        options: data.options 
      });
      
      // Cambiar según el next_step
      if (data.next_step === 'specific_area_inquiry') {
        setCurrentStep('specific_area');
      } else if (data.next_step === 'region_inquiry') {
        setCurrentStep('region');
      }
    } else {
      // Manejar error - el sector no es válido
      addMessage({ 
        text: data.message || data.error, 
        type: data.type || 'bot',
        isError: data.isError || true
      });
      
      // Si es un error específico, podemos manejarlo de forma diferente
      if (data.error_type === 'invalid_sector_format' || data.error_type === 'invalid_sector') {
        console.warn(`Invalid sector detected: ${data.error_type}`);
        // Mantener el mismo paso para permitir otro intento
        // No hacemos cambio de estado del paso actual
      }
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



const handleSpecificAreaSelection = async (specificArea) => {
  try {
    // Logs para verificar los valores antes de la solicitud
    console.log('=== DEBUG INFO: handleSpecificAreaSelection ===');
    console.log('specificArea:', specificArea);
    console.log('phase2Data:', phase2Data);
    console.log('phase2Data.sector:', phase2Data?.sector);
    console.log('userData:', userData);
    console.log('userData.name:', userData?.name);
    console.log('userData.detectedLanguage:', userData?.detectedLanguage);
    
    // Crear el objeto de datos para enviar
    const requestData = {
      sector: phase2Data?.sector,
      specific_area: specificArea,
      name: userData?.name,
      language: userData?.detectedLanguage
    };
    
    console.log('API URL:', `${import.meta.env.VITE_API_URL}/api/sector-experience`);
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    // Verificar que todos los datos necesarios existen
    if (!requestData.sector) {
      console.error('ERROR: Missing sector in request data');
    }
    
    if (!requestData.name) {
      console.error('ERROR: Missing name in request data');
    }
    
    // Realizar la solicitud
    console.log('Sending API request...');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sector-experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    // Intentar obtener la respuesta como JSON incluso si el status no es OK
    let data;
    try {
      const responseText = await response.text();
      console.log('Response text:', responseText);
      data = JSON.parse(responseText);
      console.log('Parsed JSON data:', data);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Could not parse server response');
    }
    
    // Si es un error de validación (código 400 con estructura específica)
    if (!response.ok && data && (data.error_type === "invalid_specific_area" || data.error_type === "invalid_sector")) {
      console.log('Validation error from server:', data);
      
      // Mostrar el mensaje de error como un mensaje normal del bot
      addMessage({ 
        text: data.message, 
        type: 'bot',
        isError: true 
      });
      
      return; // Salir de la función sin lanzar un error
    }
    
    // Si es otro tipo de error (no de validación)
    if (!response.ok) {
      console.error('Server error:', data);
      throw new Error('Server error: ' + (data.message || 'Unknown error'));
    }
    
    // Procesar respuesta exitosa
    if (data.success) {
      console.log('Request successful, updating state...');
      setPhase2Data(prev => ({ 
        ...prev, 
        specific_area: specificArea 
      }));
      
      addMessage({ 
        text: data.message, 
        type: 'bot',
        options: data.options 
      });
      
      // Cambiar al siguiente paso
      console.log('Changing step to region');
      setCurrentStep('region');
    } else {
      console.error('Request not successful:', data);
      // Manejar el caso en que data.success es false
      addMessage({ 
        text: data.message || 'An error occurred with your request.', 
        type: 'bot',
        isError: true 
      });
    }
  } catch (error) {
    console.error('Error handling specific area selection:', error);
    console.error('Error stack:', error.stack);
    addMessage({ 
      text: `Sorry, there was a problem processing your request. Please try again.`, 
      type: 'bot', 
      isError: true 
    });
  }
};


const handleRegionInput = async (region) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/test/process-text`, {
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
    } else {
      // Mostrar solo el mensaje de error explicativo
      addMessage({ 
        text: data.error || "Please provide a valid region.", 
        type: 'bot', 
        isError: true 
      });
      
      // Mantener el paso actual para que el usuario pueda volver a intentarlo
      setCurrentStep('region');
    }
  } catch (error) {
    console.error('Error processing region:', error);
    addMessage({ 
      text: `Error: ${error.message}`, 
      type: 'bot', 
      isError: true 
    });
    
    // También mantener el paso actual en caso de error de red
    setCurrentStep('region');
  }
};




const handleCompaniesInput = async (companies) => {
  try {
      // Convertir a minúsculas para comparación consistente
      const normalizedCompanies = companies.toLowerCase().trim();

      // Si la respuesta es 'no', ir directamente a sugerencias de empresas
      if (normalizedCompanies === 'no') {
          await handleCompanySuggestions();
          return;
      }

      // Realizar la solicitud al backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/simple-expert-connection`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
              text: companies,  // Usar el texto original
              language: userData.detectedLanguage || 'en'
          })
      });

      // Manejar errores de respuesta HTTP
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error processing companies');
      }

      // Parsear la respuesta
      const data = await response.json();

      // Verificar si se necesita clarificación
      if (data.needs_clarification) {
          // Mostrar mensaje solicitando clarificación y posiblemente permitir nueva entrada
          addMessage({ 
              text: data.message, 
              type: 'bot',
              requiresInput: true // Si tienes un flag para solicitar entrada adicional
          });
          return; // No proceder a handleCompanySuggestions aún
      }

      // Verificar si la respuesta es exitosa
      if (data.success) {
          // Determinar si está interesado en empresas
          const isInterested = normalizedCompanies !== 'no';

          // Actualizar datos de la fase 2
          setPhase2Data(prev => ({ 
              ...prev, 
              companies: data.preselected_companies || [],
              interested_in_companies: isInterested,
              isCompleted: true
          }));

          // Añadir mensaje del bot
          addMessage({ 
              text: data.message, 
              type: 'bot',
              options: data.options 
          });

          // Si está interesado, actualizar datos de la fase 3
          if (isInterested) {
              setPhase3Data(prev => ({
                  ...prev,
                  companiesForExpertSearch: data.preselected_companies || [],
                  currentExpertStep: 'initial'
              }));
          }

          // Proceder con sugerencias de empresas
          await handleCompanySuggestions();
      } else {
          // Manejar caso de respuesta no exitosa
          throw new Error(data.error || 'Unknown error processing companies');
      }
  } catch (error) {
      console.error('Error processing companies:', error);
      
      // Añadir mensaje de error
      addMessage({
          text: `Error: ${error.message}`,
          type: 'bot',
          isError: true
      });

      // Opcional: manejar el error de manera más específica
      // Por ejemplo, reintentar, mostrar un mensaje específico, etc.
  }
};



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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/company-suggestions-test`, {
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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/process-companies-agreement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: userMessage,
        language: userData.detectedLanguage
      })
    });
    
    const data = await response.json();
    console.log('Company Agreement Response:', data); // Añadir log para depuración
  
    if (data.success) {
      addMessage({
        text: data.message,
        type: 'bot'
      });
  
      // Verificación más robusta de la intención
      const intention = data.agreed?.intention || 
                        (typeof data.agreed === 'string' ? data.agreed : 'no');
      
      console.log('Detected Intention:', intention);

      if (intention.toLowerCase() === 'yes') {
        console.log('User agreed, proceeding to employment status');
        setCurrentStep('employment_status');
        setTimeout(() => {
          handleEmploymentStatus();
        }, 1000);
      } else {
        console.log('User disagreed, generating new list');
        setCurrentStep('companies');
        setTimeout(() => {
          handleCompanySuggestions();
        }, 1000);
      }
    } else {
      addMessage({
        text: data.error || 'Error processing your response. Please try again.',
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




// Corrección para handleEmploymentStatus
const handleEmploymentStatus = async () => {
  console.log('🟦 [handleEmploymentStatus] Iniciando');
  try {
    setLoading(true);
    
    const requestBody = {
      language: userData.detectedLanguage
    };
    console.log('🟦 [handleEmploymentStatus] Request:', requestBody);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/specify-employment-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('🟦 [handleEmploymentStatus] Respuesta:', data);
    
    // Agregar mensaje al chat sin importar si fue exitoso o no
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });
    
    if (data.success) {
      setCurrentStep('employment_status');
      console.log('🟦 [handleEmploymentStatus] Step actualizado a: employment_status');
    } else {
      console.log('🟦 [handleEmploymentStatus] Respuesta no exitosa:', data);
      // Si hay un error de nonsense input, permitir al usuario intentar de nuevo
      // No avanzar al siguiente paso
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

// Corrección para handleEmploymentStatusResponse
const handleEmploymentStatusResponse = async (status) => {
  console.log('🟨 [handleEmploymentStatusResponse] Iniciando con status:', status);
  try {
    setLoading(true);
    
    const requestBody = {
      status: status,
      language: userData.detectedLanguage
    };
    console.log('🟨 [handleEmploymentStatusResponse] Request:', requestBody);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/specify-employment-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('🟨 [handleEmploymentStatusResponse] Respuesta:', data);
    
    // Siempre mostrar el mensaje, independientemente del éxito
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });
    
    if (data.success) {
      console.log('🟨 [handleEmploymentStatusResponse] Actualizando phase3Data con:', data.employment_status);
      setPhase3Data(prev => ({
        ...prev,
        employmentStatus: data.employment_status
      }));
      
      console.log('🟨 [handleEmploymentStatusResponse] Iniciando timeout para handleExcludeCompanies');
      setTimeout(handleExcludeCompanies, 1000);
    } else {
      console.log('🟨 [handleEmploymentStatusResponse] Respuesta no exitosa:', data);
      // No avanzar al siguiente paso si hay un error
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




// Corrección para handleExcludeCompanies
// Corrección para handleExcludeCompanies
const handleExcludeCompanies = async () => {
  console.log('🟩 [handleExcludeCompanies] Iniciando');
  try {
    setLoading(true); // Asumiendo que existe esta función
    
    const requestBody = {
      language: userData.detectedLanguage
    };
    console.log('🟩 [handleExcludeCompanies] Request:', requestBody);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/exclude-companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('🟩 [handleExcludeCompanies] Respuesta:', data);

    // Siempre mostrar el mensaje, sin importar si fue exitoso o no
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });

    if (data.success) {
      setCurrentStep('exclude_companies');
      console.log('🟩 [handleExcludeCompanies] Step actualizado a: exclude_companies');
    } else {
      console.log('🟩 [handleExcludeCompanies] Respuesta no exitosa:', data);
      // No avanzar al siguiente paso si hay un error
    }
  } catch (error) {
    console.error('🔴 [handleExcludeCompanies] Error:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false); // Asumiendo que existe esta función
    console.log('🟩 [handleExcludeCompanies] Finalizado');
  }
};

// Actualización para handleExcludeCompaniesResponse con manejo especial para "no"
const handleExcludeCompaniesResponse = async (answer) => {
  console.log('🔍 Estado actual antes de excluir compañías:', phase3Data);
  console.log('📥 Compañías a excluir:', answer);
  
  // Verificar si la respuesta es "no" o alguna variante
  const isNoResponse = answer.toLowerCase().trim() === 'no' || 
                       answer.toLowerCase().trim() === 'n' ||
                       answer.toLowerCase().trim() === 'nope' ||
                       answer.toLowerCase().trim() === 'no.' ||
                       answer.toLowerCase().trim() === 'noo';
  
  try {
    setLoading(true); // Asumiendo que existe esta función
    
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage,
      excluded_companies: isNoResponse ? [] : answer.split(',').map(company => company.trim())
    };
    console.log('📤 Enviando solicitud a exclude-companies:', requestBody);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/exclude-companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('📥 Respuesta recibida de exclude-companies:', data);

    // Siempre mostrar el mensaje al usuario
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });

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

      // Esperar un momento antes de continuar
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleClientPerspective();
    } else if (isNoResponse) {
      // Si la respuesta es "no" pero hubo un error, continuamos de todos modos
      console.log('🟡 [handleExcludeCompaniesResponse] Respuesta "no" detectada pero el backend devolvió error.');
      console.log('🟡 [handleExcludeCompaniesResponse] Continuando al siguiente paso de todos modos.');
      
      // Actualizar estado asumiendo que no hay empresas excluidas
      await new Promise(resolve => {
        setPhase3Data(prev => {
          const newState = {
            ...prev,
            excludedCompanies: []
          };
          console.log('✅ Nuevo estado de phase3Data con respuesta "no" manual:', newState);
          resolve();
          return newState;
        });
      });
      
      // Esperar un momento antes de continuar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mensaje adicional para confirmar que no se excluirán empresas
      addMessage({
        text: "Entendido, no se excluirán empresas de la búsqueda.",
        type: 'bot'
      });
      
      await handleClientPerspective();
    } else {
      console.log('❌ Respuesta no exitosa en exclude-companies:', data);
      // No avanzar al siguiente paso si hay un error y no es "no"
    }
  } catch (error) {
    console.error('❌ Error en handleExcludeCompaniesResponse:', error);
    
    // Si hay un error pero la respuesta fue "no", continuar de todos modos
    if (isNoResponse) {
      console.log('🟡 [handleExcludeCompaniesResponse] Error, pero la respuesta fue "no". Continuando...');
      
      // Actualizar estado asumiendo que no hay empresas excluidas
      await new Promise(resolve => {
        setPhase3Data(prev => {
          const newState = {
            ...prev,
            excludedCompanies: []
          };
          resolve();
          return newState;
        });
      });
      
      // Mensaje para confirmar que no se excluirán empresas
      addMessage({
        text: "Entendido, no se excluirán empresas de la búsqueda.",
        type: 'bot'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await handleClientPerspective();
    } else {
      addMessage({
        text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
        type: 'bot',
        isError: true
      });
    }
  } finally {
    setLoading(false); // Asumiendo que existe esta función
  }
};









/////////////////////////// Corrección para handleClientPerspective
const handleClientPerspective = async () => {
  console.log('🚀 Iniciando handleClientPerspective');
  try {
    setLoading(true); // Asumiendo que existe esta función
    
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage,
      phase3_data: phase3Data
    };
    console.log('📤 Enviando solicitud a client-perspective:', requestBody);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/client-perspective`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('📥 Respuesta recibida de client-perspective:', data);

    // Siempre mostrar el mensaje al usuario
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });

    if (data.success) {
      setCurrentStep('client_perspective');
      console.log('🚀 Step actualizado a: client_perspective');
    } else {
      console.log('🔴 Respuesta no exitosa en client-perspective:', data);
      // No avanzar al siguiente paso si hay un error
    }
  } catch (error) {
    console.error('❌ Error en handleClientPerspective:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false); // Asumiendo que existe esta función
  }
};

// Corrección para handleClientPerspectiveResponse
const handleClientPerspectiveResponse = async (answer) => {
  console.log('🔍 Estado actual antes de client perspective:', phase3Data);
  try {
    setLoading(true); // Asumiendo que existe esta función
    
    const requestBody = {
      answer: answer,
      sector: phase3Data.sector,
      region: phase3Data.region,
      language: userData.detectedLanguage
    };
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/client-perspective`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('📥 Respuesta recibida de client-perspective:', data);

    // Siempre mostrar el mensaje principal, sin importar si fue exitoso o no
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });

    if (data.success) {
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
    } else {
      console.log('🔴 Respuesta no exitosa en client-perspective-response:', data);
      // No continuar con el siguiente paso
    }
  } catch (error) {
    console.error('❌ Error en handleClientPerspectiveResponse:', error);
    addMessage({
      text: 'Error processing your request. Please try again.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false); // Asumiendo que existe esta función
  }
};













// Corrección para handleSupplyChainExperience
const handleSupplyChainExperience = async () => {
  console.log('Iniciando handleSupplyChainExperience');
  try {
    setLoading(true); // Asumiendo que existe esta función
    
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/supply-chain-experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Respuesta recibida de supply-chain-experience:', data);

    // Siempre mostrar el mensaje al usuario, sin importar si fue exitoso o no
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });

    if (data.success) {
      setCurrentStep('supply_chain_experience');
    } else {
      console.log('Respuesta no exitosa en supply-chain-experience:', data);
      // No avanzar al siguiente paso si hay un error
    }
  } catch (error) {
    console.error('Error en handleSupplyChainExperience:', error);
    addMessage({
      text: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false); // Asumiendo que existe esta función
  }
};

// Corrección para handleSupplyChainExperienceResponse
const handleSupplyChainExperienceResponse = async (answer) => {
  console.log('🔍 Estado actual antes de supply chain:', phase3Data);
  try {
    setLoading(true); // Asumiendo que existe esta función
    
    const requestBody = {
      answer: answer,
      sector: phase3Data.sector,
      region: phase3Data.region,
      language: userData.detectedLanguage
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/supply-chain-experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('📥 Respuesta recibida del servidor:', data);

    // Siempre mostrar el mensaje principal
    addMessage({
      text: data.message,
      type: 'bot',
      isError: !data.success
    });

    if (data.success) {
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
    } else {
      console.log('Respuesta no exitosa en handleSupplyChainExperienceResponse:', data);
      // No avanzar al siguiente paso si hay un error
    }
  } catch (error) {
    console.error('❌ Error en handleSupplyChainExperienceResponse:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false); // Asumiendo que existe esta función
  }
};

//////////////////////////////////////////////////////////EVALUATION QUESTION

// Corrección para handleEvaluationQuestions
const handleEvaluationQuestions = async () => {
  try {
    setLoading(true); // Asumiendo que existe esta función
    setCurrentPhase(3);
    
    const requestBody = {
      answer: '',
      language: userData.detectedLanguage
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluation-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Response received:', data);

    // Siempre mostrar el mensaje al usuario
    addMessage({
      text: data.message || data.error, // Usar error si no hay mensaje
      type: 'bot',
      isError: !data.success
    });

    if (data.success) {
      setCurrentStep('evaluation_questions');
    } else {
      console.log('Respuesta no exitosa en handleEvaluationQuestions:', data);
      // No avanzar al siguiente paso si hay un error
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false); // Asumiendo que existe esta función
  }
};

// Corrección para handleEvaluationQuestionsResponse
const handleEvaluationQuestionsResponse = async (answer) => {
  try {
    setLoading(true); // Asumiendo que existe esta función
    
    const requestBody = {
      answer: answer,
      language: userData.detectedLanguage
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluation-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Response received:', data);

    // Siempre mostrar el mensaje al usuario
    addMessage({
      text: data.message || data.error, // Usar error si no hay mensaje
      type: 'bot',
      isError: !data.success
    });

    if (data.success) {
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
    } else {
      console.log('Respuesta no exitosa en handleEvaluationQuestionsResponse:', data);
      // No avanzar al siguiente paso si hay un error
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage({
      text: 'Error al procesar tu respuesta. Por favor, intenta nuevamente.',
      type: 'bot',
      isError: true
    });
  } finally {
    setLoading(false); // Asumiendo que existe esta función
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

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluation-questions-sections`, {
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
    // No duplicar la respuesta actual en current_questions
    // El backend se encargará de agregar la respuesta al conjunto correcto
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
      current_questions: phase3Data.evaluationSections.questions,
      clientPerspective: phase3Data.clientPerspective,
      supplyChainPerspective: phase3Data.supplyChainPerspective,
      // Usar detected_language para mantener consistencia con el backend
      detected_language: userData.detectedLanguage
    };
    
    console.log('Section response request:', requestBody);
    console.log('Current perspectives - Client:', phase3Data.clientPerspective,
                'Supply Chain:', phase3Data.supplyChainPerspective);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluation-questions-sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('Section response:', data);

    if (data.success) {
      // Agregar mensaje del sistema al chat
      addMessage({
        text: data.message,
        type: 'bot'
      });

      if (data.status === 'completed') {
        // Actualizar el estado para reflejar que se completaron todas las preguntas
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            ...prev.evaluationSections,
            completed: true,
            allQuestionsCompleted: true,
            questions: data.screening_questions,
            current: null,
            remaining: []
          }
        }));
        
        // Pasar directamente a buscar expertos sin el mensaje hardcodeado
        await searchIndustryExperts();
      } else {
        // Actualizar el estado para la siguiente pregunta
        setPhase3Data(prev => ({
          ...prev,
          evaluationSections: {
            ...prev.evaluationSections,
            current: data.current_category,
            remaining: data.remaining_categories,
            completed: data.completed_categories,
            questions: data.current_questions
            // No necesitamos redefinir selected_categories aquí
          }
        }));
      }
    } else {
      // Manejar respuesta de error
      console.error('Error from API:', data.error);
      addMessage({
        text: data.message || 'Hubo un problema al procesar tu respuesta. Por favor intenta nuevamente.',
        type: 'bot',
        isError: true
      });
    }
  } catch (error) {
    console.error('Error:', error);
    
    // Mensaje de error localizado según el idioma detectado
    const errorMessage = userData.detectedLanguage && userData.detectedLanguage.startsWith('es')
      ? 'Error al procesar tu respuesta. Por favor, intenta nuevamente.'
      : 'Error processing your response. Please try again.';
    
    addMessage({
      text: errorMessage,
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

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/industry-experts`, {
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
    // Log inicial
    console.log('=== Starting Expert Selection ===');
    console.log('Expert Names Input:', expertNames);

    // Validación y preparación de expertos seleccionados
    const selectedExperts = expertNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    console.log('Processed Selected Experts:', selectedExperts);

    // Verificación de datos de expertos
    if (!phase3Data?.selectedExperts) {
      console.error('No experts data available in phase3Data');
      throw new Error('No experts data available');
    }

    // Log de datos de fase 3
    console.log('Phase 3 Data:', JSON.stringify(phase3Data, null, 2));

    // Preparación del cuerpo de la solicitud
    const requestBody = {
      selected_experts: selectedExperts,
      all_experts_data: {
        experts: {
          main: { 
            experts: phase3Data.selectedExperts.companies || [],
            log: `Companies count: ${phase3Data.selectedExperts.companies?.length || 0}`
          },
          client: { 
            experts: phase3Data.selectedExperts.clients || [],
            log: `Clients count: ${phase3Data.selectedExperts.clients?.length || 0}`
          },
          supply_chain: { 
            experts: phase3Data.selectedExperts.suppliers || [],
            log: `Suppliers count: ${phase3Data.selectedExperts.suppliers?.length || 0}`
          }
        }
      },
      evaluation_questions: phase3Data?.evaluationSections?.questions || {}
    };

    // Logs detallados de la solicitud
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('Request URL:', `${import.meta.env.VITE_API_URL}/api/select-experts`);

    // Realizar solicitud
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/select-experts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Manejo de errores de red
    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorResponse = await response.json();
        console.error('Server Error Response:', errorResponse);
        // Solo extraer el mensaje de error, sin los detalles técnicos
        errorMessage = errorResponse.message || 'Error selecting experts';
      } catch {
        errorMessage = 'Error connecting to the server. Please try again.';
      }

      // Lanzar solo el mensaje de error, sin el prefijo técnico
      throw new Error(errorMessage);
    }

    // Parsear respuesta
    const data = await response.json();
    console.log('Server Response:', JSON.stringify(data, null, 2));

    // Validar respuesta
    if (!data.success) {
      console.error('Unsuccessful Response:', data);
      throw new Error(data.message || 'Error selecting experts');
    }

    // Procesar detalles de expertos
    if (data.expert_details && data.expert_details.length > 0) {
      console.log('Expert Details Found:', data.expert_details.length);
      const expert = data.expert_details[0];
      
      // Log de detalles del experto
      console.log('Selected Expert:', JSON.stringify(expert, null, 2));

      const expertHtml = `
        <div class="selected-expert-container">
          <div class="expert-selection-header"></div>
          <div class="selected-expert-card">
            <div class="expert-main-info">
              <h4 class="expert-name">${expert.name || 'Expert Name Not Available'}</h4>
              <span class="expert-category">${expert.category || 'N/A'}</span>
            </div>
            <div class="expert-info-grid">
              <div class="info-item">
                <span class="info-label">Current Role</span>
                <span class="info-value">${expert.current_role || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Company</span>
                <span class="info-value">${expert.current_employer || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Experience</span>
                <span class="info-value">${expert.experience || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Location</span>
                <span class="info-value">${expert.location || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      addMessage({ text: expertHtml, type: 'bot', isHtml: true });
    } else {
      console.warn('No expert details found in response');
    }

    // Procesar preguntas de screening
    if (data.screening_questions) {
      console.log('Screening Questions:', JSON.stringify(data.screening_questions, null, 2));
      
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
                    <h4 class="category-title">${categoryLabels[category] || category}</h4>
                    <div class="question-item">${questions || 'No questions available'}</div>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
      `;
      addMessage({ text: questionsHtml, type: 'bot', isHtml: true });
    } else {
      console.warn('No screening questions found in response');
    }

    // Mensaje final
    if (data.final_message) {
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
      console.warn('No final message found in response');
    }

    console.log('=== Expert Selection Completed Successfully ===');

  } catch (error) {
    // Manejo de errores detallado
    console.error('Detailed Error in handleExpertSelection:', {
      message: error.message,
      stack: error.stack,
      phase3Data: JSON.stringify(phase3Data, null, 2),
      selectedExperts: expertNames
    });

    // Mostrar solo el mensaje de error, sin el prefijo técnico
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
        
        case 'specific_area':  // Nuevo caso
          await handleSpecificAreaSelection(userMessage);
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
    'specific_area',
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
    {/* Eliminamos o reemplazamos el header con el indicador de fase */}
    {/* Si quieres mantener el header pero sin el indicador, puedes usar:
    <div className="chat-header">
      <div className="chat-title">Expert Consultation</div>
    </div>
    */}
    
    <div className="chat-messages" ref={messagesContainerRef}>
      {messages.map((message, index) => (
        <ChatMessage 
          key={index}
          text={message.text}
          type={message.type}
        />
      ))}
      {loading && <div className="loading">Processing your request...</div>}
      <div className="scroll-anchor"></div>
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