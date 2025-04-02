import './ChatButton.css'
import PropTypes from 'prop-types'

function ChatButton({ onClick, isOpen }) {
  // Si el chat está abierto, no renderizamos el botón
  if (isOpen) {
    return null;
  }
  
  return (
    <div className="chat-button-container">
      <button 
        className="chat-button"
        onClick={onClick}
        aria-label="Open chat"
      >
        <img 
          src="/src/assets/img/icono.jpg" 
          alt="Chat with Expert" 
          className="chat-icon"
        />
      </button>
    </div>
  )
}

ChatButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool
}

ChatButton.defaultProps = {
  isOpen: false
}

export default ChatButton