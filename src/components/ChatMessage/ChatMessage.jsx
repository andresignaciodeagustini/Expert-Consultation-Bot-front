import { useEffect } from 'react'
import './ChatMessage.css'
import PropTypes from 'prop-types'

function ChatMessage({ text, type, companies, isError }) {
  useEffect(() => {
    console.log('ChatMessage mounted/updated with props:', {
      text,
      type,
      companies,
      isError
    });
  }, [text, type, companies, isError]);

  return (
    <div className={`chat-message ${type} ${isError ? 'error' : ''}`}>
      <div className="message-content">
        {text}
        
        {companies && (
          <div className="companies-list">
            <h4>Companies Found:</h4>
            <div className="companies-section">
              {companies.zoho_companies && companies.zoho_companies.length > 0 && (
                <div>
                  <h5>From Database:</h5>
                  <ul>
                    {companies.zoho_companies.map((company, index) => (
                      <li key={index}>
                        {company.name} - {company.industry}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {companies.suggested_companies && companies.suggested_companies.length > 0 && (
                <div>
                  <h5>Additional Suggestions:</h5>
                  <ul>
                    {companies.suggested_companies.map((company, index) => (
                      <li key={index}>
                        {company.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ChatMessage.propTypes = {
  text: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['user', 'bot']).isRequired,
  isError: PropTypes.bool,
  companies: PropTypes.shape({
    zoho_companies: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        industry: PropTypes.string
      })
    ),
    suggested_companies: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired
      })
    )
  })
}

ChatMessage.defaultProps = {
  isError: false,
  companies: null
}

export default ChatMessage