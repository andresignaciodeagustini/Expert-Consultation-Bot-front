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

  const handleVoiceRecording = async (start) => {
    if (start) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.current = new MediaRecorder(stream)
        audioChunks.current = []

        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data)
        }

        mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' })
          try {
            const response = await processVoice(
              audioBlob,
              currentStep,
              currentStep === 'sector' ? currentRegion : null
            )

            if (response.transcription?.trim()) {
              onSendMessage({
                type: 'message',
                value: response.transcription.trim()
              })
            } else {
              onSendMessage({
                type: 'error',
                value: 'I could not understand what you said. Please try again.'
              })
            }
          } catch (error) {
            console.error('Error processing voice:', error)
            onSendMessage({
              type: 'error',
              value: 'Sorry, there was an error processing your voice. Please try again.'
            })
          }
        }

        mediaRecorder.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error accessing microphone:', error)
      }
    } else {
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop()
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
      }
    }
  }

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