import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom"; // Import useNavigate and useParams
import JoditEditor from "jodit-react"; // Rich text editor component
import Sidebar from "../Sidebar/sidebar.jsx"; // Sidebar component
import "./DocumentRepository.css";

const EditorPage = () => {
  const [documentTitle, setDocumentTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { id, spaceName } = useParams(); // Get the document ID and department (spaceName) from the URL
  const navigate = useNavigate(); // Use useNavigate for redirecting

  const backendUrl = "http://localhost:5001/api/document";

  useEffect(() => {
    if (id) {
      // If ID is available, it's an edit scenario
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

    const method = isEditing ? "PUT" : "POST"; // PUT for editing, POST for creating
    const endpoint = isEditing ? "/editDocument" : "/createDocument";
    const payload = {
      title: documentTitle,
      content: editorContent,
      userId: localStorage.getItem("userId"),
    };

    // Add document ID for updates (only when editing)
    if (isEditing) {
      payload.id = id;
    }

    axios({
      method,
      url: `${backendUrl}${endpoint}`,
      data: payload,
    })
      .then((res) => {
        const data = res.data;
        if (data.success) {
          alert(data.message);

          // Navigate to the specific department's document section
          navigate(`/department/${spaceName}/documents`);
        } else {
          alert(data.message);
        }
      })
      .catch((err) => console.error("Error saving document:", err));
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
          config={{
            readonly: false,
            height: 400,
          }}
        />

        <button className="save-btn" onClick={saveDocument}>
          {isEditing ? "Save Changes" : "Create Document"}
        </button>
        <button
          className="cancel-btn"
          onClick={() => navigate(`/department/${spaceName}/documents`)} // Navigate back to the specific department's document section
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditorPage;
