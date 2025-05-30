import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import JoditEditor from "jodit-react";
import Sidebar from "../Sidebar/sidebar.jsx";
import { FiArrowLeft, FiSave, FiX } from "react-icons/fi";
import "./EditorPage.css"; // Renamed CSS file for specificity
import Jodit from "jodit-react";

const EditorPage = () => {
  const { id, department } = useParams();
  const [documentTitle, setDocumentTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const backendUrl = "http://localhost:5001/api/document";

  const editor = useRef(null);
  const editorContentRef = useRef("");
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError("");
      axios
        .get(`${backendUrl}/getDocumentById/${id}`)
        .then((res) => {
          const doc = res.data.document;
          setDocumentTitle(doc.title);
          editorContentRef.current = doc.content;
          setIsEditing(true);
        })
        .catch((err) => {
          console.error("Error fetching document:", err);
          setError("Failed to fetch document. Please try again later.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    const fetchDepartmentName = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5001/api/department/getDepartment/${department}`
        );
        setDepartmentName(response.data.name);
      } catch (error) {
        console.error("Error fetching department name:", error);
        setDepartmentName(department); // Fallback to ID if fetch fails
      }
    };

    if (department) {
      fetchDepartmentName();
    }
  }, [department]);

  const editorConfig = {
    readonly: false,
    height: "calc(100vh - 300px)",
    minHeight: 400,
    buttons: ["bold", "italic", "underline", "link", "ul", "ol", "image"],
    uploader: {
      insertImageAsBase64URI: true,
    },
    defaultMode: "wysiwyg",
  events: {
    afterInit: (editor) => {
      // left align
      editor.editor.style.textAlign = "left";
    },
  },
};

  const saveDocument = () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!userId || !token) {
      setError("You must be logged in to save documents");
      return;
    }
  
    if (!documentTitle.trim()) {
      setError("Document title cannot be empty!");
      return;
    }
  
    const payload = {
      title: documentTitle,
      content: editorContentRef.current,
      department,
      userId,
      ...(isEditing && { id }), // Only include id if editing
    };
  
    const endpoint = isEditing 
      ? `${backendUrl}/editDocument`
      : `${backendUrl}/createDocument`;
  
    const method = isEditing ? "put" : "post";
  
    setLoading(true);
    setError("");
  
    axios[method](endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.data.success) {
          navigate(`/department/${department}/documents`, {
            state: { departmentName },
          });
        } else {
          setError(res.data.message || "Failed to save document");
        }
      })
      .catch((err) => {
        console.error("Save error:", err.response?.data);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to save document"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="editor-page-container">
      <Sidebar />

      <main className="editor-main-content">
        <header className="editor-header">
          <button
            className="back-button"
            onClick={() =>
              navigate(`/department/${department}/documents`, {
                state: { departmentName: departmentName },
              })
            }
          >
            <FiArrowLeft />
          </button>

          <h1>{isEditing ? "Edit Documents" : "Create New Document"}</h1>
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="editor-form-container">
          <input
            type="text"
            className="document-title-input"
            placeholder="Document Title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            required
          />

          <div className="editor-wrapper">
            <JoditEditor
              ref={editor}
              value={editorContentRef.current}
              onChange={(newContent) => (editorContentRef.current = newContent)}
              config={editorConfig}
            />
          </div>

          <div className="editor-actions">
            <button
              className="save-button"
              onClick={saveDocument}
              disabled={loading}
            >
              <FiSave /> {loading ? "Saving..." : "Save Document"}
            </button>
            <button
              className="cancel-button"
              onClick={() => navigate(`/department/${department}/documents`)}
            >
              <FiX /> Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditorPage;
