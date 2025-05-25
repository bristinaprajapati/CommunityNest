const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const router = express.Router();
const Document = require("../models/Document");
const Department = require("../models/Department"); // Assuming you have this model
const User = require("../models/User"); // Assuming you have a User model
const Notification = require('../models/Notification');
const Community = require('../models/Community');

// Create a new document
router.post("/createDocument", async (req, res) => {
  try {
    const { title, content, department, userId } = req.body;

    if (!title || !content || !department || !userId) {
      return res.status(400).json({
        success: false,
        message: "All fields (title, content, department, userId) are required",
      });
    }

    // Validate department exists
    const departmentData = await Department.findById(department);
    if (!departmentData) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create new document
    const newDocument = new Document({
      title,
      content,
      userId,
      department,
    });

    await newDocument.save();

     // Send notifications
     const io = req.app.get('io');
     await sendDocumentNotifications(io, newDocument, userId);
 
     res.status(201).json({ success: true, document: newDocument });
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({
      success: false,
      message: "Error creating document",
      error: error.message,
    });
  }
});




// Get documents by department and user (handles community & member status)
router.get("/getDocumentsByDepartmentAndUser/:departmentId/:userId", async (req, res) => {
  try {
    const { departmentId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid department or user ID" });
    }

    // Find user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let query = { department: departmentId };
    
    if (user.status === "member" && user.communityDetails[0]?.adminId) {
      // For members: Get documents created by their admin OR by themselves
      query.$or = [
        { userId: user.communityDetails[0].adminId },  // Admin's documents
        { userId: userId }  // Member's own documents
      ];
    } else if (user.status === "community") {
      // For community admins: Get their own documents AND those created by their members
      const community = await Community.findOne({ admin: userId });
      
      if (community && community.members.length > 0) {
        // Include documents created by the admin and all community members
        query.$or = [
          { userId: userId },  // Admin's own documents
          { userId: { $in: community.members } }  // Documents created by any member
        ];
      } else {
        // Fallback to just admin's documents if no community/members found
        query.userId = userId;
      }
    } else {
      // For other users: Get only their own documents
      query.userId = userId;
    }

    // Rest of the function remains the same...
    // Fetch documents based on the query
    const documents = await Document.find(query)
      .populate("department", "name")
      .exec();

    // Get department name (fallback to query if not populated)
    let departmentName = documents[0]?.department?.name;
    if (!departmentName) {
      const dept = await Department.findById(departmentId);
      departmentName = dept?.name || "";
    }

    res.status(200).json({ 
      success: true, 
      documents,
      departmentName
    });
  } catch (error) {
    console.error("Error fetching documents:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching documents",
      error: error.message,
    });
  }
});


router.delete("/deleteDocument/:id", async (req, res) => {
  try {
    const { id } = req.params; // Extract ID from URL

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid document ID" });
    }

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
router.delete("/deleteByDepartment/:departmentName", async (req, res) => {
  try {
    const { departmentName } = req.params;

    // Check if there are any documents in the department by department name
    const documents = await Document.find({ department: departmentName });

    if (documents.length > 0) {
      return res.status(400).json({
        success: false,
        message: "The department's document repository is not empty. Please empty the repository before deleting the department.",
      });
    }

    // Remove department from Department collection
    await Department.findOneAndDelete({ name: departmentName });

    res.status(200).json({
      success: true,
      message: `The department '${departmentName}' has been deleted as its document repository is empty.`,
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

router.put("/editDocument", async (req, res) => {
  try {
    const { id, title, content, department, userId } = req.body;

    if (!id || !title || !content || !department || !userId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate document exists
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Update document
    document.title = title;
    document.content = content;
    document.department = department;
    document.updatedAt = new Date();
    document.lastEditedBy = userId; // Track who made the edit

    await document.save();

    // Send update notifications
    const io = req.app.get('io');
    await sendDocumentNotifications(io, document, userId, 'updated');

    res.status(200).json({
      success: true,
      message: "Document updated successfully!",
      document,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({
      success: false,
      message: "Error updating document",
      error: error.message,
    });
  }
});



// Get a document by ID
router.get("/getDocumentById/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    // Find the document by ID
    const document = await Document.findById(id)
      .populate("department", "name") // If needed, populate department name
      .exec();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching document",
      error: error.message,
    });
  }
});

const sendDocumentNotifications = async (io, document, userId) => {
  try {
    // Get the user who triggered the action
    const sender = await User.findById(userId).populate('communityDetails.communityId');
    if (!sender) return;

    let community;
    let membersToNotify = [];

    if (sender.status === "member") {
      // For members - get their first community
      if (sender.communityDetails.length > 0) {
        const communityId = sender.communityDetails[0].communityId;
        community = await Community.findOne({ _id: communityId })
          .populate('members', '_id');
        
        if (community) {
          // Notify all members except the sender
          membersToNotify = community.members
            .filter(member => member._id.toString() !== userId.toString())
            .map(member => member._id.toString());
        }
      }
    } else if (sender.status === "community") {
      // For admins - get their managed community
      community = await Community.findOne({ admin: userId })
        .populate('members', '_id');
      
      if (community) {
        // Notify all members
        membersToNotify = community.members
          .map(member => member._id.toString());
      }
    }

    if (membersToNotify.length === 0) return;

    // Create and send notifications
    await Promise.all(membersToNotify.map(async memberId => {
      const notification = new Notification({
        recipient: memberId,
        sender: userId,
        message: `New document: ${document.title}`,
        type: 'document',
        relatedEntity: document._id
      });
      
      await notification.save();
      
      // Emit socket notification
      io.to(`user_${memberId}`).emit('new-notification', {
        ...notification.toObject(),
        sender: {
          _id: sender._id,
          username: sender.username
        }
      });
    }));

    console.log(`Sent notifications to ${membersToNotify.length} users`);
  } catch (error) {
    console.error('Notification error:', error);
  }
};

module.exports = router;

