import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./department.css";
import Sidebar from "../Sidebar/sidebar.jsx";
import dotsIcon from "../dots.png";

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [renameModal, setRenameModal] = useState(false);
  const [departmentToRename, setDepartmentToRename] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    fetchUserStatus();
    fetchDepartments();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/auth/data", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUserStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  const fetchDepartments = () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      axios
        .get(
          `http://localhost:5001/api/department/getDepartments?userId=${userId}`
        )
        .then((response) => {
          setDepartments(response.data.data);
        })
        .catch((error) => {
          console.error(error);
          alert("Error fetching departments");
        });
    } else {
      alert("You must be logged in to view your departments");
    }
  };

  const addDepartment = async () => {
    if (!newDepartment.trim()) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("You must be logged in to create a department");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5001/api/department/createDepartment",
        { name: newDepartment, userId }
      );
      setDepartments([...departments, response.data.data]);
      setNewDepartment("");
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert("Error creating department");
    }
  };

  const handleDeleteDepartment = (id) => {
    if (!window.confirm("Are you sure you want to delete this department?"))
      return;

    axios
      .delete(`http://localhost:5001/api/department/deleteDepartment/${id}`)
      .then(() => {
        setDepartments(departments.filter((dept) => dept._id !== id));
        alert("Department deleted successfully.");
      })
      .catch((err) => {
        console.error("Error deleting department:", err.response?.data || err);
        alert("Error deleting department, please try again.");
      });
  };

  const handleRenameDepartment = (department) => {
    setDepartmentToRename(department);
    setRenameValue(department.name);
    setRenameModal(true);
  };

  const handleSaveRename = async () => {
    const userId = localStorage.getItem("userId");
    if (!renameValue.trim() || !userId) {
      alert("Enter a valid department name.");
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5001/api/department/renameDepartment/${departmentToRename._id}`,
        { name: renameValue, userId }
      );
      setDepartments(
        departments.map((dept) =>
          dept._id === departmentToRename._id ? response.data.data : dept
        )
      );
      setRenameModal(false);
      alert("Department renamed successfully.");
    } catch (error) {
      console.error(error);
      alert("Error renaming department.");
    }
  };

  const handleDepartmentClick = (dept) => {
    navigate(`/department/${dept._id}/documents`, { state: { departmentName: dept.name } });
  };
  const dropdownRefs = useRef({});
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs.current).forEach((key) => {
        if (
          dropdownRefs.current[key] &&
          !dropdownRefs.current[key].contains(event.target) &&
          !event.target.classList.contains("ellipsis-icon")
        ) {
          setActiveMenu(null);
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="department-page">
    <Sidebar />
    <div className="departments-container">
      <div className="header-wrapper">
        <div className="header-titles">
          <h1>Department Workspace</h1>
          <p className="subtitle">Organize your documents by department</p>
        </div>
        
        <div className="header-actions">
          <div className="department-count-badge">
            <span className="count-number">{departments.length}</span>
            <span className="count-text">
              {departments.length === 1 ? "Department" : "Departments"}
            </span>
          </div>
          
          {userStatus !== "member" && (
            <button 
              className="create-department-btn" 
              onClick={() => setShowModal(true)}
            >
              + Create Department
            </button>
          )}
        </div>
      </div>

        

        <div className="department-container">
          {departments.length === 0 ? (
            <p className="no-departments">No departments found</p>
          ) : (
            departments.map((dept) => (
              <div key={dept._id} className="department-card">
                <div className="department-content">
                  <h2>{dept.name}</h2>
                  <p className="department-subtitle">Department</p>
                  <button
                    className="view-documents-btn"
                    onClick={() => handleDepartmentClick(dept)}
                  >
                    View Documents
                  </button>
                </div>

                <button
                  className="ellipsis-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === dept._id ? null : dept._id);
                  }}
                  aria-label="More options"
                >
                  ⋯
                </button>

                {activeMenu === dept._id && (
                  <div
                    className="dropdown-menu"
                    ref={(el) => (dropdownRefs.current[dept._id] = el)}
                  >
                    <button onClick={() => handleRenameDepartment(dept)}>
                      Rename
                    </button>
                    <button onClick={() => handleDeleteDepartment(dept._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Department Modal */}
      {showModal && (
        <div className="modal-overlay1" onClick={() => setShowModal(false)}>
          <div className="modal-content1" onClick={(e) => e.stopPropagation()}>
            <h3>Create Department</h3>
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="Department Name"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={addDepartment}>Create</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Department Modal */}
      {renameModal && (
        <div className="modal-overlay2" onClick={() => setRenameModal(false)}>
          <div className="modal-content2" onClick={(e) => e.stopPropagation()}>
            <h3>Rename Department</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New Department Name"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={handleSaveRename}>Save</button>
              <button onClick={() => setRenameModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Department;
