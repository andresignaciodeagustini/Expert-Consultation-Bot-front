import './ChatButton.css'
import PropTypes from 'prop-types'
import chatIcon from '../../assets/img/icono.png'  // Importa la imagen correctamente

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
          src={chatIcon}  // Usa la variable importada en lugar de la ruta directa
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