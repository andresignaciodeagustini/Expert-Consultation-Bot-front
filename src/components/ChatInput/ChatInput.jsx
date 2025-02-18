import { useState } from 'react'
import PropTypes from 'prop-types'
import './ChatInput.css'

function ChatInput({ onSendMessage, disabled, step }) {
  const [location, setLocation] = useState('')
  const [sector, setSector] = useState('')

  const VALID_SECTORS = ["Technology", "Financial Services", "Manufacturing"]

  const handleSubmit = (e) => {
    e.preventDefault()

    if (step === 1 && location.trim()) {
      // Cuando se envía la ubicación
      onSendMessage({ type: 'location', value: location.trim() })
      setLocation('')
    } else if (step === 2 && sector) {
      // Cuando se envía el sector
      onSendMessage({ 
        type: 'complete',
        sector: sector
      })
      setSector('')
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      {step === 1 ? (
        // Paso 1: Solicitar ubicación
        <div className="input-container">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location..."
            disabled={disabled}
          />
          <button type="submit" disabled={disabled || !location.trim()}>
            Next
          </button>
        </div>
      ) : (
        // Paso 2: Solicitar sector
        <div className="input-container">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            disabled={disabled}
          >
            <option value="">Select a sector...</option>
            {VALID_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" disabled={disabled || !sector}>
            Search Companies
          </button>
        </div>
      )}
    </form>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  step: PropTypes.number.isRequired
}

ChatInput.defaultProps = {
  disabled: false
}

export default ChatInput