import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import "./Modal.css";
import Sidebar from "../Sidebar/sidebar.jsx";
import { jsPDF } from "jspdf";

const Modal = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [docData, setDocData] = useState(null);

  useEffect(() => {
    const docData = searchParams.get("data");
    if (docData) {
      setDocData(JSON.parse(decodeURIComponent(docData)));
    }
  }, [searchParams]);

  const downloadFile = (type) => {
    if (!docData) return;

    // Function to remove HTML tags and extract plain text
    const stripHtmlTags = (html) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || "No content available";
    };

    const fileContent = stripHtmlTags(docData.content);

    if (type === "doc") {
      // DOC generation logic here (already covered in your code)
      const file = new Blob([fileContent], { type: "application/msword" });
      const element = window.document.createElement("a");
      element.href = URL.createObjectURL(file);
      element.download = `${docData.title || "document"}.doc`;
      window.document.body.appendChild(element);
      element.click();
      window.document.body.removeChild(element);
    } else if (type === "pdf") {
      // Generate PDF using jsPDF with the plain text content
      const doc = new jsPDF();
      doc.text(fileContent, 10, 10); // Add plain text content to the PDF
      doc.save(`${docData.title || "document"}.pdf`); // Save and trigger download
    }
  };

  if (!docData) return <p>Loading document...</p>;

  return (
    <div className="document-view">
      <Sidebar />
      <h2>{docData.title}</h2>
      <div
        className="document-content"
        dangerouslySetInnerHTML={{ __html: docData.content }}
      ></div>
      <div className="document-actions">
        <button onClick={() => downloadFile("doc")}>Download as DOC</button>
        <button onClick={() => downloadFile("pdf")}>Download as PDF</button>
      </div>
    </div>
  );
};

export default Modal;
