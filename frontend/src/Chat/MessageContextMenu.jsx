import { useEffect, useRef } from 'react';

const MessageContextMenu = ({ position, onClose, onDelete }) => {
    const menuRef = useRef(null);
  
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          onClose();
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
  
    return (
      <div 
        ref={menuRef}
        className="context-menu"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 1000,
          backgroundColor: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          borderRadius: '4px',
          padding: '8px 0',
          minWidth: '150px'
        }}
      >
        <div 
          className="menu-item"
          onClick={onDelete}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            color: '#ff4d4f',
            ':hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          Delete Message
        </div>
      </div>
    );
  };

export default MessageContextMenu;