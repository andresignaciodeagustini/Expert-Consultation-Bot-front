import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { processVoice } from '../../services/api'
import './ChatInput.css'
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'
import { IoSend } from 'react-icons/io5'

function ChatInput({ onSendMessage, disabled, currentStep, currentRegion }) {
  const [message, setMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        try {
          const response = await processVoice(
            audioBlob, 
            currentStep, 
            currentStep === 'sector' ? currentRegion : null
          );
          
          onSendMessage({ 
            type: 'voice', 
            value: response.transcription,
            response: response 
          });
        } catch (error) {
          console.error('Error processing voice:', error);
          onSendMessage({ 
            type: 'error', 
            value: 'Error processing voice message' 
          });
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
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
          onClick={isRecording ? stopRecording : startRecording}
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
  onSendMessage: PropTypes.shape({
    type: PropTypes.string,
    value: PropTypes.string,
    response: PropTypes.object
  }),
  disabled: PropTypes.bool,
  currentStep: PropTypes.string,
  currentRegion: PropTypes.string
}

ChatInput.defaultProps = {
  onSendMessage: () => {},
  disabled: false,
  currentStep: 'region',
  currentRegion: null
}

export default ChatInput