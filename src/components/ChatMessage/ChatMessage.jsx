import { useEffect } from 'react'
import './ChatMessage.css'
import PropTypes from 'prop-types'

function ChatMessage({ text, type, companies, messages, detected_language, isError }) {
  useEffect(() => {
    console.log('ChatMessage mounted/updated with props:', {
      text,
      type,
      companies,
      messages,
      detected_language,
      isError
    });
  }, [text, type, companies, messages, detected_language, isError]);

  const renderCompanies = () => {
    if (!companies) return null;

    return (
      <div className="companies-list">
        {/* Zoho Companies */}
        {companies.zoho && companies.zoho.length > 0 && (
          <div className="zoho-companies">
            <h4>{messages?.from_database}</h4>
            <ul>
              {companies.zoho.map((company) => (
                <li key={company.id} className="company-item">
                  <h5>{company.name}</h5>
                  <div className="company-details">
                    {company.industry && <p>{company.industry}</p>}
                    {company.region_coverage && (
                      <p>{company.region_coverage.join(', ')}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        
        {companies.suggestions && companies.suggestions.length > 0 && (
          <div className="suggested-companies">
            <h4>{messages?.additional_suggestions}</h4>
            <ul>
              {companies.suggestions.map((company, index) => (
                <li key={index} className="suggestion-item">
                  {company.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`chat-message ${type} ${isError ? 'error' : ''}`}>
      <div className="message-content">
        <p className="message-text">{text}</p>
        {renderCompanies()}
      </div>
    </div>
  );
}

ChatMessage.propTypes = {
  text: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['user', 'bot']).isRequired,
  isError: PropTypes.bool,
  companies: PropTypes.shape({
    zoho: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        industry: PropTypes.string,
        region_coverage: PropTypes.arrayOf(PropTypes.string)
      })
    ),
    suggestions: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired
      })
    ),
    total_count: PropTypes.number
  }),
  messages: PropTypes.shape({
    additional_suggestions: PropTypes.string,
    companies_found: PropTypes.string,
    from_database: PropTypes.string
  }),
  detected_language: PropTypes.string
};

ChatMessage.defaultProps = {
  isError: false,
  companies: null,
  messages: null,
  detected_language: null
};

export default ChatMessage