import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "../Sidebar/sidebar.jsx";
import Modal from "./Modal.jsx";
import "./DocumentRepository.css";
import { useParams } from "react-router-dom";

const DocumentRepositoryPage = () => {
  const { department } = useParams();
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const backendUrl = "http://localhost:5001/api/document";

  useEffect(() => {
    axios
      .get(`${backendUrl}/getDocumentsByDepartment/${department}`)
      .then((res) => {
        console.log("Documents fetched:", res.data); // Debugging
        setDocuments(res.data);
      })
      .catch((err) => console.error("Error fetching documents:", err));
  }, [department]);

  const deleteDocument = (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      axios
        .delete(`${backendUrl}/deleteDocument`, { data: { id } })
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

//   const viewDocument = (id) => {
//     console.log("Fetching document with ID:", id);
//     axios
//       .get(`${backendUrl}/getDocumentById/${id}`)
//       .then((res) => {
//         console.log("Document fetched:", res.data);
//         setSelectedDocument(res.data); // Set the document with HTML content
//         setIsModalOpen(true); // Open the modal
//         console.log("Modal should open now:", isModalOpen); // Log to check modal visibility
//       })
//       .catch((err) => console.error("Error fetching document details:", err));
// };
const viewDocument = (id) => {
  console.log("Fetching document with ID:", id);
  axios
    .get(`${backendUrl}/getDocumentById/${id}`)
    .then((res) => {
      console.log("Document fetched:", res.data);
      // Redirect to the Modal.jsx route with document details
      const documentData = res.data;
      const encodedData = encodeURIComponent(JSON.stringify(documentData)); // Encode data for passing through the route
      window.location.href = `/department/${department}/documents/view/${id}?data=${encodedData}`;
    })
    .catch((err) => console.error("Error fetching document details:", err));
};


  
  useEffect(() => {
    console.log("isModalOpen changed:", isModalOpen);
  }, [isModalOpen]); // Log whenever isModalOpen state changes
  
  return (
    <div className="document-repository-page">
      <Sidebar />
      <div className="document-repository-content">
        <h2 className="document-repository-title">Document Repository</h2>
        <h4>Manage your documents: create, edit, or delete them easily.</h4>
  
        <Link to={`/department/${department}/documents/create`} className="create-new-btn">
          Create New Document
        </Link>
  
        <div className="document-cards">
          {documents.map((doc) => (
            <div key={doc._id} className="document-card">
              <div className="document-info">
                <h3>{doc.title}</h3>
                <p>Last updated: {new Date(doc.updatedAt).toDateString()}</p>
              </div>
  
              <div className="button-container">
                <button
                  className="view-btn"
                  onClick={() => viewDocument(doc._id)}
                >
                  View
                </button>
                <Link to={`/department/${department}/documents/edit/${doc._id}`} className="edit-btn">
                  Edit
                </Link>
              </div>
  
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
  
      {isModalOpen && selectedDocument && (
        console.log("Rendering Modal"), // Debugging line
        <Modal
          document={selectedDocument}
          closeModal={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
  
};

export default DocumentRepositoryPage;
