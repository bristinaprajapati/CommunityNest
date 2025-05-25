import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "../Sidebar/sidebar.jsx";
import "./DocumentRepository.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi"; // Add this with your other icon imports
import {
  FiFile,
  FiMoreVertical,
  FiDownload,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUpload,
} from "react-icons/fi";

const DocumentRepositoryPage = () => {
  const { department } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("status");
  const backendUrl = "http://localhost:5001/api/document";
  const fileBackendUrl = "http://localhost:5001/api/file";
  const [isLoading, setIsLoading] = useState(false);

  // Inside your component:
  const location = useLocation();
  const [departmentName, setDepartmentName] = useState(
    location.state?.departmentName || ""
  );

  useEffect(() => {
    if (!userId) {
      setErrorMessage("Please login to access documents");
      navigate("/login");
      return;
    }

    if (userRole === "member") {
      axios
        .get(`http://localhost:5001/api/users/getCommunityDetails/${userId}`)
        .then((res) => {
          if (res.data?.communityDetails?.[0]?.adminId) {
            const adminIdFromDB = res.data.communityDetails[0].adminId;
            setAdminId(adminIdFromDB);
            fetchDocumentsAndFiles(department, adminIdFromDB);
          }
        })
        .catch(console.error);
    } else {
      fetchDocumentsAndFiles(department, userId);
    }
  }, [department, userId, userRole]);

  // const fetchDepartmentName = async (departmentId) => {
  //   try {
  //     const response = await axios.get(
  //        `http://localhost:5001/api/department/${departmentId}`
  //     );
  //     return response.data.name;
  //   } catch (error) {
  //     console.error("Error fetching department name:", error);
  //     return departmentId; // Fallback to ID if fetch fails
  //   }
  // };
  
  // Update your useEffect for department name
  useEffect(() => {
    const loadDepartmentName = async () => {
      // First try to get from navigation state
      if (location.state?.departmentName) {
        setDepartmentName(location.state.departmentName);
        return;
      }
      
      // If not in state, fetch from API
      // const name = await fetchDepartmentName(department);
      // setDepartmentName(name);
    };
  
    if (department) {
      loadDepartmentName();
    }
  }, [department, location.state]);

  const fetchDocumentsAndFiles = async (deptId) => {
    try {
      // Always use the current userId - the backend will handle the member/community logic
      const [docsRes, filesRes] = await Promise.all([
        axios.get(`${backendUrl}/getDocumentsByDepartmentAndUser/${deptId}/${userId}`),
        axios.get(`${fileBackendUrl}/getFilesByDepartmentAndUser/${deptId}/${userId}`)
      ]);
  
      setDocuments(docsRes.data.documents || []);
      setFiles((filesRes.data.files || []).map(file => ({
        ...file,
        filePath: `http://localhost:5001/uploads/${file.filePath}`,
      })));
  
      // Use department name from response or fetch separately
      if (docsRes.data.departmentName) {
        setDepartmentName(docsRes.data.departmentName);
      } else {
        const nameResponse = await axios.get(
          `http://localhost:5001/api/department/getDepartment/${deptId}`
        );
        setDepartmentName(nameResponse.data.name);
      }
  
      setErrorMessage(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setErrorMessage("Failed to load documents");
    }
  };
  
  // Then in your useEffect:
  useEffect(() => {
    if (!userId) {
      setErrorMessage("Please login to access documents");
      navigate("/login");
      return;
    }
    fetchDocumentsAndFiles(department);
  }, [department, userId]);

  const deleteDocument = (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      axios
        .delete(`${backendUrl}/deleteDocument/${id}`)
        .then(() => {
          setDocuments((prev) => prev.filter((doc) => doc._id !== id));
        })
        .catch(console.error);
    }
  };

  const deleteFile = (id) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      axios
        .delete(`${fileBackendUrl}/deleteFile/${id}`)
        .then(() => {
          setFiles((prev) => prev.filter((file) => file._id !== id));
        })
        .catch(console.error);
    }
  };

  const handleViewClick = (file) => {
    if (file?._id) {
      // Open in new tab with PDF viewer
      const pdfUrl = `http://localhost:5001/api/file/view/${file._id}`;
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return alert("Please select a file");
  
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("filename", selectedFile.name);
    formData.append("fileType", selectedFile.type);
    formData.append("department", department); // department ID
    formData.append("departmentName", departmentName); // using existing state
    formData.append("userId", userId);
  
    try {
      setIsLoading(true);
      const response = await axios.post("http://localhost:5001/api/file/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      const res = await axios.get(
        `${fileBackendUrl}/getFilesByDepartmentAndUser/${department}/${userId}`
      );
      setFiles(res.data.files);
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="document-repository-container">
      <Sidebar />

      <main className="document-repository-main">
        <div className="main-title-row">
        <button className="back-button" onClick={() => navigate('/department')}>
            <FiArrowLeft />
          </button>
          <h1>Document Repository</h1>
        </div>

        <header className="repository-header">
          <div className="header-title-group">
            <span className="department-badge">
              Department: {departmentName}
            </span>
          </div>

          <div className="action-buttons">
            <Link
              to={`/department/${department}/documents/create`}
              className="btn btn-primary"
            >
              <FiPlus /> Create New
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => setShowUploadModal(true)}
            >
              <FiUpload /> Upload File
            </button>
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </header>

        <section className="documents-section">
          <h2>Created Documents</h2>
          {documents.length > 0 ? (
            <div className="documents-grid">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  type="Document"
                  title={doc.title}
                  createdAt={doc.createdAt}
                  updatedAt={doc.updatedAt}
                  onView={() =>
                    navigate(
                      `/department/${department}/documents/view/${doc._id}`
                    )
                  }
                  onEdit={() =>
                    navigate(
                      `/department/${department}/documents/edit/${doc._id}`
                    )
                  }
                  onDelete={() => deleteDocument(doc._id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">No documents created yet</div>
          )}
        </section>

        <section className="files-section">
          <h2>Uploaded Files</h2>
          {files.length > 0 ? (
            <div className="documents-grid">
              {files.map((file) => (
                <DocumentCard
                  key={file._id}
                  type="File"
                  title={file.filename}
                  createdAt={file.uploadedAt}
                  uploadedBy={file.uploadedBy} 
                  onView={() => handleViewClick(file)}
                  onDelete={() => deleteFile(file._id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">No files uploaded yet</div>
          )}
        </section>
      </main>

      {showUploadModal && (
        <div className="modal-overlay1">
          <div className="modal-content">
            <h3>Upload New File</h3>
            <div className="file-upload-area">
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <label htmlFor="file-upload" className="file-upload-label">
                {selectedFile ? selectedFile.name : "Choose a file"}
              </label>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={uploadFile}
                disabled={!selectedFile}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentCard = ({
  type,
  title,
  createdAt,
  updatedAt,
  uploadedBy,
  onView,
  onEdit,
  onDelete,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <article className="document-card" onClick={onView}>
    <div className="card-icon">
      <FiFile size={36} />
      <span className="file-type-badge">{type}</span>
    </div>

    <div className="card-content">
      <h3 className="card-title">{title}</h3>

      <div className="card-meta">
        <div className="meta-item">
          <span className="meta-label">Uploaded by:</span>
          <span>{uploadedBy?.username || 'Unknown'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Created:</span>
          <span>{new Date(createdAt).toLocaleDateString()}</span>
        </div>
        {updatedAt && (
          <div className="meta-item">
            <span className="meta-label">Updated:</span>
            <span>{new Date(updatedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>

      <div className="card-actions" ref={dropdownRef}>
        <div className="dropdown">
          <button
            className="dropdown-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <FiMoreVertical />
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              {onEdit && (
                <button
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowDropdown(false);
                  }}
                >
                  <FiEdit2 /> Edit
                </button>
              )}
              <button
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowDropdown(false);
                }}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
export default DocumentRepositoryPage;
