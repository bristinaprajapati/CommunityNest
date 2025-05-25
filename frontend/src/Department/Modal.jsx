import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Modal.css";
import Sidebar from "../Sidebar/sidebar.jsx";
import html2pdf from "html2pdf.js";
import { FiArrowLeft, FiDownload, FiFileText } from "react-icons/fi";

const Modal = () => {
  const { id, department } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);
  const backendUrl = "http://localhost:5001/api/document";

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/getDocumentById/${id}`);
        setDocData(response.data.document);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDocument();
  }, [id]);

  const downloadFile = (type) => {
    if (!docData?.content) return;

    const filename = `${docData.title || "document"}.${type}`;
    
    if (type === "pdf") {
      const opt = {
        margin: 1,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
      };
      html2pdf().from(contentRef.current).set(opt).save();
    } else {
      const fileContent = `<!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office'
        xmlns:w='urn:schemas-microsoft-com:office:word'
        xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='UTF-8'></head>
        <body>${docData.content}</body>
        </html>`;

      const blob = new Blob(["\ufeff", fileContent], { 
        type: "application/msword" 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleBack = () => {
    navigate(`/department/${department}/documents`, {
      state: { 
        departmentName: location.state?.departmentName || docData?.department?.name || ""
      }
    });
  };

  if (loading) return <div className="loading-container">Loading document...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="document-view-container">
      <Sidebar />
      
      <main className="document-view-main">
        <div className="document-header">
          <button className="back-button" onClick={handleBack}>
            <FiArrowLeft />
          </button>
          <h1>{docData?.title || "Untitled Document"}</h1>
        </div>

        <div className="document-content-wrapper">
          <div 
            className="document-content" 
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: docData?.content || "<p>No content available</p>" }}
          />
        </div>

        <div className="document-actions">
          <button 
            className="btn-download doc"
            onClick={() => downloadFile("doc")}
          >
            <FiFileText /> Download as DOC
          </button>
          <button 
            className="btn-download pdf"
            onClick={() => downloadFile("pdf")}
          >
            <FiDownload /> Download as PDF
          </button>
        </div>
      </main>
    </div>
  );
};

export default Modal;