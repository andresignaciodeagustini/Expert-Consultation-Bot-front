import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import './ChatInput.css'
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'
import { IoSend } from 'react-icons/io5'

function ChatInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])

  const handleVoiceRecording = async (start) => {
    if (start) {
      console.log('🎤 Iniciando grabación...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm' // Usar webm que es más compatible
        });
        audioChunks.current = []

        mediaRecorder.current.ondataavailable = (event) => {
          console.log('📊 Chunk de audio recibido:', event.data.size, 'bytes');
          audioChunks.current.push(event.data)
        }

        mediaRecorder.current.onstop = async () => {
          console.log('⏹️ Grabación detenida');
          const audioBlob = new Blob(audioChunks.current, { 
            type: 'audio/webm' 
          });
          console.log('📦 Tamaño del audio blob:', audioBlob.size, 'bytes');
          
          try {
            console.log('🚀 Preparando FormData para envío...');
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');

            console.log('📤 Enviando audio al servidor...');
            const response = await fetch('http://localhost:8080/api/ai/voice/process', {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 Respuesta completa del servidor:', data);

            if (data.success && data.transcription) {
              console.log('✅ Transcripción exitosa:', data.transcription);
              onSendMessage({
                type: 'message',
                value: data.transcription
              });
            } else if (data.error) {
              console.error('❌ Error del servidor:', data.error);
              throw new Error(data.error);
            } else {
              console.error('❌ No hay transcripción en la respuesta:', data);
              throw new Error('No se pudo obtener la transcripción');
            }
          } catch (error) {
            console.error('🔴 Error procesando audio:', error);
            onSendMessage({
              type: 'error',
              value: 'Error al procesar el audio. Por favor, intenta nuevamente.'
            });
          } finally {
            // Limpiar los recursos
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
          }
        }

        mediaRecorder.current.start();
        setIsRecording(true);
        console.log('🎙️ Grabación iniciada');
      } catch (error) {
        console.error('🔴 Error accediendo al micrófono:', error);
        setIsRecording(false);
      }
    } else {
      if (mediaRecorder.current?.state === 'recording') {
        console.log('⏹️ Deteniendo grabación...');
        mediaRecorder.current.stop();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage({ type: 'message', value: message.trim() })
      setMessage('')
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled || isRecording}
        />
        <button 
          type="button"
          onClick={() => handleVoiceRecording(!isRecording)}
          className={`icon-button ${isRecording ? 'recording' : ''}`}
          disabled={disabled}
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button 
          type="submit"
          disabled={disabled || !message.trim() || isRecording}
          className="icon-button send-button"
          title="Send message"
        >
          <IoSend />
        </button>
      </div>
    </form>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func,
  disabled: PropTypes.bool
}

ChatInput.defaultProps = {
  onSendMessage: () => {},
  disabled: false
}

export default ChatInput