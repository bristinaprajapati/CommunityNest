import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar/sidebar.jsx";
import "./EventDetails.css";
import { useRef } from "react";
import {
  FaPlus,
  FaFolder,
  FaEllipsisV,
  FaPaperclip,
  FaEnvelope,
  FaRegCopy,
  FaTrashAlt,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const EventDetails = () => {
  const { eventId } = useParams();
  const [eventTitle, setEventTitle] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(""); // For storing Google Sheet URL
  const [activeTab, setActiveTab] = useState("registration");
  const [loading, setLoading] = useState(true);
  const [columnHeaders, setColumnHeaders] = useState([]); // To store the column headers
  const baseUrl = "http://localhost:5001/api"; // Base URL for API requests
  const [googleSheets, setGoogleSheets] = useState([]); // Array to store multiple Google Sheets
  const [uploading, setUploading] = useState(false); // Loading state for upload
  const [activeSheetTitle, setActiveSheetTitle] = useState("");
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null); // Track which dropdown is open
  const [openDropdownUrl, setOpenDropdownUrl] = useState(null); // Track which dropdown is open by URL
  const [showUploadPopup, setShowUploadPopup] = useState(false); // Control popup visibility
  const [editableField, setEditableField] = useState(null); // Track which field is editable
  const [activeSheetUrl, setActiveSheetUrl] = useState(""); // Track the active sheet URL
  const [editableEmails, setEditableEmails] = useState("");
  const [feedbackEmails, setFeedbackEmails] = useState([]);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const dropdownRef = useRef(null);
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);

  const [deletingRow, setDeletingRow] = useState(null);
  const [setUserStatus] = useState(null);
  const userStatus = localStorage.getItem("status") || null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownIndex(null);
        setOpenDropdownUrl(null); 
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Initialize editableEmails with the emails of attendees marked as "Present"
    const presentEmails = getPresentAttendees()
      .map((attendee) => attendee.Email)
      .join(", ");
    setEditableEmails(presentEmails);
  }, [activeSheetUrl, attendees]); // Re-run when activeSheetUrl or attendees change

  useEffect(() => {
    const fetchAuthDetails = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/meeting/user/auth-details`,
          {
            withCredentials: true, // Include cookies in the request
          }
        );

        if (response.data.token && response.data.email) {
          setToken(response.data.token);
          setEmail(response.data.email);
          console.log("Token and email found in response.");
          console.log("Token:", response.data.token);
          console.log("Email:", response.data.email);
        } else {
          console.error("Token or email not found in response.");
        }
      } catch (error) {
        console.error("Error fetching auth details:", error);
      }
    };

    fetchAuthDetails();
  }, []);

  useEffect(() => {
    const fetchEventTitle = async () => {
      try {
        const response = await axios.get(`${baseUrl}/events/${eventId}/title`);
        setEventTitle(response.data.title);
      } catch (error) {
        console.error("Error fetching event title:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchGoogleSheets = async () => {
      try {
        const response = await axios.get(
          `${baseUrl}/google-sheets/${eventId}/sheet-info`
        );
        const { googleSheets } = response.data;

        if (googleSheets && googleSheets.length > 0) {
          setGoogleSheets(googleSheets); // Set the array of Google Sheets
        }
      } catch (error) {
        console.error("Error fetching Google Sheets information:", error);
      }
    };

    fetchEventTitle();
    fetchGoogleSheets();
  }, [eventId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sendFeedbackEmail = async (emails, subject, message) => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/events/send-feedback-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: emails, // Array of recipient emails
            subject: subject, // Email subject
            message: message, // Email message
          }),
          credentials: "include", // Include cookies in the request
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Clear form on success
        setFeedbackSubject("");
        setFeedbackMessage("");
        alert("Feedback emails sent successfully!");
      } else {
        alert(`Failed to send feedback emails: ${data.error}`);
      }
    } catch (error) {
      console.error("Error sending feedback emails:", error);
      alert("An error occurred while sending feedback emails.");
    }
  };

  // Function to handle the Google Sheets file upload
  const handleFileUpload = async (sheetUrl) => {
    if (!sheetUrl) {
      alert("Please provide a Google Sheets URL.");
      return;
    }

    // Check if the sheet URL already exists
    if (googleSheets.some((sheet) => sheet.url === sheetUrl)) {
      alert("This Google Sheet has already been uploaded.");
      return;
    }

    setUploading(true); // Set loading state

    try {
      const response = await fetch(`${baseUrl}/google-sheets/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await response.json();
      console.log("Fetched Google Sheet Data:", data);

      if (data && Array.isArray(data.headers) && Array.isArray(data.data)) {
        // Add "Status" column only if it doesn't exist
        if (!data.headers.includes("Status")) {
          data.headers.push("Status");
          data.data.forEach((row) => (row.Status = "absent")); // Initialize status as "absent"
        }

        // Save Google Sheet information to the backend
        await axios.post(`${baseUrl}/google-sheets/${eventId}/save-sheet`, {
          sheetUrl,
          sheetTitle: data.sheetTitle,
          headers: data.headers,
          data: data.data,
        });

        // Add the new Google Sheet to the state
        setGoogleSheets((prevSheets) => [
          ...prevSheets,
          { url: sheetUrl, title: data.sheetTitle },
        ]);

        // Clear the input field
        setGoogleSheetUrl("");
      } else {
        console.error("Invalid data format.");
      }
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
    } finally {
      setUploading(false); // Reset loading state
      setShowUploadPopup(false); // Close the popup after upload
    }
  };

  // Function to handle editing attendee data
  const handleEdit = (attendeeId, columnName, newValue) => {
    setAttendees((prevAttendees) =>
      prevAttendees.map((attendee, index) =>
        index === attendeeId
          ? { ...attendee, [columnName]: newValue }
          : attendee
      )
    );
  };
  // Function to handle field click
  const handleFieldClick = (rowIndex, columnName) => {
    setEditableField({ rowIndex, columnName }); // Set the clicked field as editable
  };

  const handleSaveChanges = async (attendeeId, columnName, newValue) => {
    const columnIndex = columnHeaders.indexOf(columnName);
    if (columnIndex === -1) {
      console.error(
        `Column "${columnName}" not found in headers:`,
        columnHeaders
      );
      return; // Stop execution if column doesn't exist
    }

    try {
      const response = await axios.put(`${baseUrl}/google-sheets/update`, {
        sheetUrl: googleSheetUrl,
        rowIndex: attendeeId + 1, // Adjusted for Google Sheets' 1-based indexing
        columnIndex, // Corrected column index
        newValue,
      });

      console.log("Successfully updated:", response.data);
    } catch (error) {
      console.error("Error updating Google Sheets:", error);
    }
  };

  const handleSheetClick = async (sheetUrl, sheetTitle) => {
    setActiveSheetUrl(sheetUrl);
    setGoogleSheetUrl(sheetUrl);
    setActiveSheetTitle(sheetTitle);

    try {
      const response = await fetch(`${baseUrl}/google-sheets/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await response.json();
      console.log("Fetched Google Sheet Data:", data);

      if (data && Array.isArray(data.headers) && Array.isArray(data.data)) {
        // Ensure "Status" column exists
        if (!data.headers.includes("Status")) {
          data.headers.push("Status");
          data.data.forEach((row) => (row.Status = "absent")); // Initialize status as "absent"
        }

        setColumnHeaders(data.headers);
        setAttendees(data.data); // Set the attendees for the selected sheet
      } else {
        console.error("Invalid data format.");
      }
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
    }
  };

  const getPresentAttendees = () => {
    if (!activeSheetUrl) return []; // No sheet selected

    const activeSheet = googleSheets.find(
      (sheet) => sheet.url === activeSheetUrl
    );
    if (!activeSheet) return []; // Selected sheet not found

    // Filter attendees marked as "Present"
    const sheetAttendees = attendees.filter(
      (attendee) => attendee.Status === "attended" // Ensure "Status" column is used
    );

    return sheetAttendees;
  };

  const handleSheetSelect = async (sheetUrl) => {
    setActiveSheetUrl(sheetUrl); // Set the active sheet URL
    setOpenDropdownIndex(null); // Close any open dropdowns

    try {
      const response = await fetch(`${baseUrl}/google-sheets/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetUrl }),
      });

      const data = await response.json();
      console.log("Fetched Google Sheet Data:", data);

      if (data && Array.isArray(data.headers) && Array.isArray(data.data)) {
        setColumnHeaders(data.headers);
        setAttendees(data.data); // Set the attendees for the selected sheet
      } else {
        console.error("Invalid data format.");
      }
    } catch (error) {
      console.error("Error fetching Google Sheets data:", error);
    }
  };

  const handleDeleteSheet = async (sheetUrl) => {
    if (window.confirm("Are you sure you want to delete this sheet?")) {
      try {
        // Send the sheetUrl to the backend for deletion
        await axios.delete(`${baseUrl}/google-sheets/${eventId}/delete-sheet`, {
          data: { sheetUrl },
        });

        // Remove the sheet from the state
        setGoogleSheets((prevSheets) =>
          prevSheets.filter((sheet) => sheet.url !== sheetUrl)
        );

        // Clear the active sheet if it was deleted
        if (googleSheetUrl === sheetUrl) {
          setGoogleSheetUrl("");
          setActiveSheetTitle("");
          setColumnHeaders([]);
          setAttendees([]);
        }

        alert("Sheet deleted successfully!");
      } catch (error) {
        console.error("Error deleting Google Sheet:", error);
        alert("Failed to delete the sheet. Please try again.");
      }
    }
    setOpenDropdownIndex(null); // Close the dropdown after deletion
  };

  const handleCopySheetLink = (sheetUrl) => {
    navigator.clipboard
      .writeText(sheetUrl)
      .then(() => {
        alert("Sheet link copied to clipboard!");
      })
      .catch((error) => {
        console.error("Failed to copy sheet link:", error);
        alert("Failed to copy sheet link. Please try again.");
      });
    setOpenDropdownIndex(null); // Close the dropdown after copying
  };

  // Function to handle adding a new row
  const handleAddRow = () => {
    const newRow = {};
    columnHeaders.forEach((header) => {
      newRow[header] = ""; // Initialize all fields as empty
    });
    newRow.status = "absent"; // Default status

    setAttendees((prevAttendees) => [...prevAttendees, newRow]);
  };

  const UploadPopup = ({ onClose, onUpload }) => {
    const [sheetUrl, setSheetUrl] = useState("");

    const handleUpload = () => {
      onUpload(sheetUrl);
      onClose();
    };

    return (
      <div className="upload-popup-overlay">
        <div className="upload-popup">
          <div className="popup-header">
            <h3>Upload Google Sheet</h3>
            <button className="close-btn" onClick={onClose}>
              <IoMdClose />
            </button>
          </div>
          <div className="popup-body">
            <p>Paste the link to your Google Sheet below:</p>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="sheet-url-input"
            />
          </div>
          <div className="popup-footer">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={!sheetUrl}
            >
              <FaPaperclip /> Upload Sheet
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="event-details-container">
      <div className="event-header">
        <h1 className="event-title">
          {loading ? "Loading..." : eventTitle || "Event Not Found"}
        </h1>
        {/* <div className="event-actions"> */}
        <button
          className="btn-primary"
          onClick={() => setShowUploadPopup(true)}
          disabled={uploading}
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <FaPlus /> Add Sheet
            </>
          )}
        </button>
        {/* </div> */}
      </div>

      <nav className="event-tabs">
        <button
          className={`tab-btn ${activeTab === "registration" ? "active" : ""}`}
          onClick={() => setActiveTab("registration")}
        >
          <FaFolder /> Attendees
        </button>
        {userStatus !== "member" && (
          <button
            className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
            onClick={() => setActiveTab("feedback")}
          >
            <FaEnvelope /> Feedback
          </button>
        )}
      </nav>

      <div className="event-content">
        <div className="event-main">
          {activeTab === "registration" && (
            <div className="registration-section">
              <div className="section-header">
                <h2>Attendee Management</h2>
                {/* {columnHeaders.length > 0 && (
                  <button className="btn-secondary" onClick={handleAddRow}>
                    <FaPlus /> Add Attendee
                  </button>
                )} */}
              </div>

              {googleSheets.length > 0 && (
                <div className="sheet-grid">
                  {googleSheets.map((sheet) => (
                    <div
                      key={sheet.url}
                      className={`sheet-card ${
                        activeSheetUrl === sheet.url ? "active" : ""
                      }`}
                      onClick={() => handleSheetClick(sheet.url, sheet.title)}
                    >
                      <div className="sheet-card-content">
                        <span className="folder-icon">
                          <FaFolder />
                        </span>
                        <span className="sheet-title">{sheet.title}</span>
                      </div>
                      <div className="sheet-actions" ref={dropdownRef}>
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Dropdown clicked", sheet.url);
                            setOpenDropdownUrl(
                              openDropdownUrl === sheet.url ? null : sheet.url
                            );
                          }}
                        >
                          <FaEllipsisV />
                        </button>
                        {openDropdownUrl === sheet.url && (
                          <div className="dropdown-menu2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopySheetLink(sheet.url);
                              }}
                            >
                              <FaRegCopy /> Copy Link
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSheet(sheet.url);
                              }}
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {columnHeaders.length > 0 && (
                <div className="table-wrapper">
                  <table className="attendee-table">
                    <thead>
                      <tr>
                        {columnHeaders.map((header, index) => (
                          <th key={index}>{header}</th>
                        ))}
                        {/* <th>Actions</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((attendee, rowIndex) => (
                        <tr key={rowIndex}>
                          {columnHeaders.map((header, columnIndex) => (
                            <td key={columnIndex}>
                              {header === "Status" ? (
                                <select
                                  value={attendee[header]}
                                  onChange={(e) => {
                                    handleEdit(
                                      rowIndex,
                                      header,
                                      e.target.value
                                    );
                                    handleSaveChanges(
                                      rowIndex,
                                      header,
                                      e.target.value
                                    );
                                  }}
                                  className="status-select"
                                >
                                  <option value="absent">Absent</option>
                                  <option value="attended">Present</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={attendee[header]}
                                  readOnly={
                                    !editableField ||
                                    editableField.rowIndex !== rowIndex ||
                                    editableField.columnName !== header
                                  }
                                  onClick={() =>
                                    handleFieldClick(rowIndex, header)
                                  }
                                  onChange={(e) =>
                                    handleEdit(rowIndex, header, e.target.value)
                                  }
                                  onBlur={(e) =>
                                    handleSaveChanges(
                                      rowIndex,
                                      header,
                                      e.target.value
                                    )
                                  }
                                  className="attendee-field"
                                />
                              )}
                            </td>
                          ))}

                          {/* <td>
  <button 
    className="delete-row-btn"
    onClick={() => handleDeleteRow(rowIndex)}
    title="Delete row"
    disabled={deletingRow === rowIndex}
  >
    {deletingRow === rowIndex ? (
      "Deleting..."
    ) : (
      <FaTrashAlt />
    )}
  </button>
</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="add-attendee-footer">
                    <button className="btn-secondary" onClick={handleAddRow}>
                      <FaPlus /> Add Attendee
                    </button>
                  </div>
                </div>
              )}

              {googleSheets.length === 0 && (
                <div className="empty-state">
                  <FaFolder className="empty-icon" />
                  <h3>No Google Sheets Added</h3>
                  <p>Upload a Google Sheet to start managing attendees</p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowUploadPopup(true)}
                  >
                    <FaPlus /> Add Your First Sheet
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="feedback-section">
              <div className="feedback-container">
                <div className="feedback-sidebar">
                  <h3>Feedback Recipients</h3>
                  <div className="sheet-selector">
                    <label>Select Sheet</label>
                    <select
                      onChange={(e) => handleSheetSelect(e.target.value)}
                      value={activeSheetUrl}
                    >
                      <option value="">- Select a sheet -</option>
                      {googleSheets.map((sheet) => (
                        <option key={sheet.url} value={sheet.url}>
                          {sheet.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeSheetUrl && (
                    <div className="active-sheet-info">
                      <h4>Active Sheet</h4>
                      <p className="sheet-name">
                        {
                          googleSheets.find(
                            (sheet) => sheet.url === activeSheetUrl
                          )?.title
                        }
                      </p>
                    </div>
                  )}

                  <div className="recipient-list">
                    <h4>Attendees Marked as Present</h4>
                    {getPresentAttendees().length > 0 ? (
                      <ul>
                        {getPresentAttendees().map((attendee, index) => (
                          <li key={index}>
                            <span className="email-badge">
                              {attendee.Email}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-recipients">
                        No attendees marked as "Present"
                      </div>
                    )}
                  </div>
                </div>

                <div className="feedback-form-container">
                  <h3>Compose Feedback Email</h3>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const emails = editableEmails
                        .split(",")
                        .map((email) => email.trim())
                        .filter((email) => email);

                      if (emails.length === 0) {
                        alert("Please add at least one valid email address.");
                        return;
                      }

                      await sendFeedbackEmail(
                        emails,
                        e.target.subject.value,
                        e.target.message.value
                      );
                    }}
                  >
                    <div className="form-group">
                      <label>To:</label>
                      <textarea
                        value={editableEmails}
                        onChange={(e) => setEditableEmails(e.target.value)}
                        placeholder="Enter recipient emails, separated by commas"
                        rows={3}
                      />
                    </div>

                    <div className="form-group">
                      <label>Subject:</label>
                      <input
                        type="text"
                        name="subject"
                        value={feedbackSubject}
                        onChange={(e) => setFeedbackSubject(e.target.value)}
                        placeholder="Enter email subject"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Message:</label>
                      <textarea
                        name="message"
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        placeholder="Enter your feedback message"
                        rows={6}
                        required
                      />
                    </div>

                    <button type="submit" className="btn-primary send-btn">
                      <FaEnvelope /> Send Email
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <Sidebar />
        </div>
      </div>

      {showUploadPopup && (
        <UploadPopup
          onClose={() => setShowUploadPopup(false)}
          onUpload={handleFileUpload}
        />
      )}
    </div>
  );
};

export default EventDetails;
