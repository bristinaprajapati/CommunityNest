import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import './department.css'; // Add relevant styles for departments

const Department = ({ onSelectDepartment }) => {
  const [departments, setDepartments] = useState(['HR', 'IT', 'Finance']);
  const [newDepartment, setNewDepartment] = useState('');
  const [showModal, setShowModal] = useState(false);

  const addDepartment = () => {
    if (newDepartment) {
      setDepartments([...departments, newDepartment]);
      setNewDepartment('');
      setShowModal(false);
    }
  };

  return (
    <div className="Department-section">
      <h2>Departments</h2>
      <div className="Department-cards">
        {departments.map((dept, index) => (
          <div
            key={index}
            className="Department-card"
            onClick={() => onSelectDepartment(dept)}
          >
            {dept}
          </div>
        ))}
        <div
          className="Department-card Add-department-card"
          onClick={() => setShowModal(true)}
        >
          <FontAwesomeIcon icon={faPlusCircle} className="Add-department-icon" size="3x" />
        </div>
      </div>

      {showModal && (
        <div className="Modal">
          <div className="Modal-content">
            <FontAwesomeIcon icon={faTimes} className="Close-icon" onClick={() => setShowModal(false)} />
            <h3>Add New Department</h3>
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="Department Name"
              className="Add-department-input"
            />
            <button onClick={addDepartment} className="Add-department-button">
              Create Department
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Department;
