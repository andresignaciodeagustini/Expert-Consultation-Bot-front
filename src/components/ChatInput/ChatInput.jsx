import { useState } from 'react'
import PropTypes from 'prop-types'
import './ChatInput.css'  // Cambiado de ChatMessage.css a ChatInput.css

function ChatInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('')

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
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !message.trim()}>
          Send
        </button>
      </div>
    </form>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

ChatInput.defaultProps = {
  disabled: false
}

export default ChatInput