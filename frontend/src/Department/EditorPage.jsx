import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import JoditEditor from "jodit-react";
import Sidebar from "../Sidebar/sidebar.jsx"; // Import your Sidebar component
import "./DocumentRepository.css";

const EditorPage = () => {
  const { id, department } = useParams(); // Get document ID and department from the URL
  const [documentTitle, setDocumentTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const backendUrl = "http://localhost:5001/api/document"; // Update this to match your backend URL

  useEffect(() => {
    if (id) {
      // If editing, fetch the document by ID
      axios
        .get(`${backendUrl}/getDocumentById/${id}`)
        .then((res) => {
          setDocumentTitle(res.data.title);
          setEditorContent(res.data.content);
          setIsEditing(true);
        })
        .catch((err) => console.error("Error fetching document:", err));
    }
  }, [id]);

  const saveDocument = () => {
    if (!documentTitle.trim() || !editorContent.trim()) {
      alert("Title and content cannot be empty!");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? "/editDocument" : "/createDocument";

    const payload = {
      title: documentTitle,
      content: editorContent,
      userId: localStorage.getItem("userId"),
      department,
      ...(isEditing && { id }), // Add ID to the payload only for editing
    };

    console.log("Payload being sent:", payload); // Debugging log

    axios({
      method,
      url: `${backendUrl}${endpoint}`,
      data: payload,
    })
      .then((res) => {
        const data = res.data;
        alert(data.message);
        if (data.success) {
          navigate(`/department/${department}/documents`);
        }
      })
      .catch((err) => {
        console.error("Error saving document:", err);
        alert("An error occurred while saving the document.");
      });
  };

  return (
    <div className="document-repository-page">
      <Sidebar />
      <div className="document-repository-content">
        <h2>{isEditing ? "Edit Document" : "Create New Document"}</h2>
        <input
          type="text"
          className="title-input"
          placeholder="Enter document title"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
        />
        <JoditEditor
          value={editorContent}
          onChange={(newContent) => setEditorContent(newContent)}
          config={{ readonly: false, height: 400 }}
        />
        <button className="save-btn" onClick={saveDocument}>
          {isEditing ? "Save Changes" : "Create Document"}
        </button>
        <button
          className="cancel-btn"
          onClick={() => navigate(`/department/${department}/documents`)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditorPage;
