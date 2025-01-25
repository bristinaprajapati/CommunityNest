import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link for navigation
import Sidebar from "../Sidebar/sidebar.jsx"; // Sidebar component
import "./DocumentRepository.css";

const DocumentRepositoryPage = () => {
  const [documents, setDocuments] = useState([]);
  const backendUrl = "http://localhost:5001/api/document";

  useEffect(() => {
    // Fetch documents from the database
    axios
      .get(`${backendUrl}/getDocuments`)
      .then((res) => setDocuments(res.data))
      .catch((err) => console.error("Error fetching documents:", err));
  }, []);

  const deleteDocument = (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      axios
        .delete(`${backendUrl}/deleteDocument`, {
          data: { id },
        })
        .then((res) => {
          const data = res.data;
          if (data.success) {
            alert(data.message);
            setDocuments((prevDocs) => prevDocs.filter((doc) => doc._id !== id));
          } else {
            alert(data.message);
          }
        })
        .catch((err) => console.error("Error deleting document:", err));
    }
  };

  return (
    <div className="document-repository-page">
      <Sidebar />
      <div className="document-repository-content">
        <h2 className="document-repository-title">Document Repository</h2>
        <p>Manage your documents: create, edit, or delete them easily.</p>

        <Link to="/documents/create" className="create-new-btn">Create New Document</Link>

        <div className="document-cards">
          {documents.map((doc) => (
            <div key={doc._id} className="document-card">
              <div className="document-info">
                <h3>{doc.title}</h3>
                <p>Last updated: {new Date(doc.updatedAt).toDateString()}</p>
              </div>

              {/* // For each document in the repository */}
                <Link to={`/documents/edit/${doc._id}`} className="edit-btn">Edit</Link>

              <button
                className="delete-btn"
                onClick={() => deleteDocument(doc._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentRepositoryPage;
