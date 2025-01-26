import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./department.css";
import Sidebar from "../Sidebar/sidebar.jsx"; // Import the Sidebar component

const Department = () => {
  const [departments, setDepartments] = useState([
    { name: "HR", id: "1" },
    { name: "IT", id: "2" },
    { name: "Finance", id: "3" },
  ]);
  const [newDepartment, setNewDepartment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const addDepartment = () => {
    if (newDepartment.trim()) {
      const newDept = {
        name: newDepartment,
        id: (departments.length + 1).toString(), // Generate a unique ID (could be more robust in production)
      };
      setDepartments([...departments, newDept]); // Add new department
      setNewDepartment("");
      setShowModal(false);
    }
  };

  const handleDepartmentClick = (dept) => {
  navigate(`/department/${dept.id}/documents`); // Navigate to department-specific repository
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
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="Department-card"
            onClick={() => handleDepartmentClick(dept)}
          >
            {dept.name}
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