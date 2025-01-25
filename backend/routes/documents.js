const express = require("express");
const router = express.Router();
const Document = require("../models/Document");

// Create a new document
router.post("/createDocument", async (req, res) => {
  try {
    const { title, content, userId } = req.body;

    const newDocument = new Document({
      title,
      content,
      userId,
    });

    await newDocument.save();
    res.status(201).json({ success: true, message: "Document created!", newDocument });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating document", error });
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

module.exports = router;
