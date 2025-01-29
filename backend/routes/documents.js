const express = require("express");
const router = express.Router();
const Document = require("../models/Document");

// Create a new document
router.post("/createDocument", async (req, res) => {
    try {
      const { title, content, userId, department } = req.body;
  
      // Validate the incoming data
      if (!title || !content || !userId || !department) {
        return res.status(400).json({
          success: false,
          message: "All fields (title, content, userId, department) are required",
        });
      }
  
      const newDocument = new Document({
        title,
        content,
        userId,
        department, // Include department
      });
  
      await newDocument.save();
      res.status(201).json({
        success: true,
        message: "Document created!",
        newDocument,
      });
    } catch (error) {
      console.error("Error creating document:", error); // Log the error for better debugging
      res.status(500).json({
        success: false,
        message: "Error creating document",
        error: error.message, // Send the error message for better clarity
      });
    }
  });
  

  // get documents by department
  router.get("/getDocumentsByDepartment/:department", async (req, res) => {
    try {
      const { department } = req.params;
  
      const documents = await Document.find({ department });
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching documents", error });
    }
  });
  

// Get all documents
router.get("/getDocuments", async (req, res) => {
  try {
    const documents = await Document.find();
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching documents", error });
  }
});

// Edit a document
router.put("/editDocument", async (req, res) => {
  try {
    const { id, title, content } = req.body;
    console.log("Received update request for document ID:", id); // Log the incoming ID

    // Find the document by ID and update
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      { title, content },
      { new: true } // Return the updated document
    );

    if (!updatedDocument) {
      console.log("Document not found with the ID:", id); // Log if document is not found
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    console.log("Updated document:", updatedDocument); // Log the updated document
    res.status(200).json({ success: true, message: "Document updated!", updatedDocument });
  } catch (error) {
    console.error("Error updating document:", error); // Log any error during the update
    res.status(500).json({ success: false, message: "Error updating document", error });
  }
});

// Get document by ID
router.get("/getDocumentById/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get document ID from the URL

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json(document); // Return the found document
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching document", error });
  }
});

// Delete a document
router.delete("/deleteDocument", async (req, res) => {
  try {
    const { id } = req.body;

    const deletedDocument = await Document.findByIdAndDelete(id);

    if (!deletedDocument) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json({ success: true, message: "Document deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting document", error });
  }
});

// Delete department and all documents in it only if the document repository is empty
router.delete("/deleteByDepartment/:department", async (req, res) => {
  try {
    const { department } = req.params;

    // Check if there are any documents in the department
    const documents = await Document.find({ department });

    if (documents.length > 0) {
      return res.status(400).json({
        success: false,
        message: "The department's document repository is not empty. Please empty the repository before deleting the department.",
      });
    }

    // If no documents, proceed with deleting the department (you can also delete the department here if needed)

    res.status(200).json({
      success: true,
      message: `The department '${department}' has been deleted as its document repository is empty.`,
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting the department",
      error: error.message,
    });
  }
});





module.exports = router;
