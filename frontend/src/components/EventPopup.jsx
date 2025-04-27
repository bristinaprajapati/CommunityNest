import React from 'react';
import './EventPopup.css';

const EventPopup = ({ event, onClose }) => {
  // Debug log to verify received data
  console.log("Popup received event:", event);
  
  return (
    <div className="event-popup-overlay" onClick={onClose}>
      <div className="event-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="event-popup-close" onClick={onClose}>×</button>
        
        <h3>{event?.title || 'Event Details'}</h3>
        
        {event?.image ? (
          <img 
            src={event.image} 
            alt={event.title ? `Event: ${event.title}` : 'Event image'} 
            className="event-popup-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="no-image-placeholder">No image available</div>
        )}

        <div className="event-popup-details">
          <p><strong>Date:</strong> {event?.date || 'Not specified'}</p>
          <p><strong>Time:</strong> {event?.time || 'Not specified'}</p>
          <p><strong>Organized by:</strong> {event?.organizer || 'Unknown organizer'}</p>
        </div>

        <button className="event-popup-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default EventPopup;