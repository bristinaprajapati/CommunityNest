import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './department.css';
import Sidebar from '../Sidebar/sidebar.jsx'; // Import the Sidebar component

const Department = () => {
  const [departments, setDepartments] = useState(['HR', 'IT', 'Finance']);
  const [newDepartment, setNewDepartment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const addDepartment = () => {
    if (newDepartment) {
      setDepartments([...departments, newDepartment]); // Add new department
      setNewDepartment('');
      setShowModal(false);
    }
  };

  const handleDepartmentClick = (dept) => {
    // Redirect to the document repository of the clicked department
    navigate(`/department/${dept}/documents`);
  };

  return (
    <div className="Department-section">
      <Sidebar />
      <div className="Department-header">
        <h2>Departments</h2>

        {/* Add Department Button */}
        <button
          className="Add-department-button"
          onClick={() => setShowModal(true)}
        >
          <FontAwesomeIcon icon={faPlusCircle} className="Add-department-icon" />
          Add New Department
        </button>
      </div>

      {/* Department Cards */}
      <div className="Department-cards">
        {departments.map((dept, index) => (
          <div
            key={index}
            className="Department-card"
            onClick={() => handleDepartmentClick(dept)}
          >
            {dept}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="Modal">
          <div className="Modal-content">
            <FontAwesomeIcon
              icon={faTimes}
              className="Close-icon"
              onClick={() => setShowModal(false)}
            />
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

