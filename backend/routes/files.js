// module.exports = router;
const express = require("express");
const multer = require("multer");
const path = require("path");
const File = require("../models/File"); // Create this model
const router = express.Router();
const fs = require('fs');
const pdfParse = require("pdf-parse"); // For extracting text from PDFs
const cors = require('cors'); // Import CORS package
const User = require("../models/User"); // Assuming you have a User model

// Enable CORS
router.use(cors()); // This will allow all domains. For more strict control, you can specify allowed origins, like 'http://localhost:3000'

// Define uploads directory path
const UPLOADS_DIR = path.join(__dirname, '../uploads'); 

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR); // Store files in the uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Use a timestamp to avoid name conflicts
  },
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  }
});

// Route to upload file (only PDF allowed)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Uploaded file:", req.file);

    // Ensure required fields are present
    if (!req.body.filename || !req.body.fileType || !req.body.department || !req.body.userId) {
      return res.status(400).json({ error: "filename, fileType, department, and userId are required." });
    }

    // Get the user to check their status
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Determine the owner ID - use admin ID for members
    let ownerId = req.body.userId;
    if (user.status === "member" && user.communityDetails.length > 0) {
      ownerId = user.communityDetails[0].adminId;
    }

    const newFile = new File({
      filename: req.file.originalname,
      filePath: req.file.filename,
      fileType: req.file.mimetype,
      department: req.body.department,
      userId: ownerId,
      uploadedBy: req.body.userId
    });

    await newFile.save();

    // Get the uploading user's info
    const uploadingUser = await User.findById(req.body.userId);

    // Send notifications using departmentName from request body
    await sendFileNotifications(
      req.app.get('io'),
      newFile,
      req.body.userId,
      uploadingUser.username,
      req.body.departmentName // Using from request
    );

    res.status(201).json({ success: true, file: newFile });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});


// Route to get files by department and user
router.get("/getFilesByDepartmentAndUser/:department/:userId", async (req, res) => {
  try {
    let { department, userId } = req.params;

    // Fetch the user from the database to check their status
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let files;
    
    // If the user is a member, we want files owned by their admin OR uploaded by them
    if (user.status === "member" && user.communityDetails.length > 0) {
      const adminId = user.communityDetails[0].adminId;
      files = await File.find({
        department,
        $or: [
          { userId: adminId },  // Files owned by admin
          { uploadedBy: userId } // Files uploaded by this member
        ]
      }).populate('uploadedBy', 'username'); // Populate the uploader's username
    } else {
      // For community users, just get their files
      files = await File.find({ department, userId })
        .populate('uploadedBy', 'username');
    }

    res.status(200).json({ success: true, files });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ success: false, message: "Error fetching files" });
  }
});


// Route to delete a file
router.delete("/deleteFile/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const result = await File.findByIdAndDelete(fileId);

    if (!result) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Delete the actual file from the filesystem
    const filePath = path.join(UPLOADS_DIR, result.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Remove the file from the disk
    }

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

router.get('/view/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).send('File not found');

    // Get the absolute path to the file
    const filePath = path.resolve(file.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File does not exist on server');
    }

    // Set proper headers for PDF display in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).send('Server error');
  }
});



// Route to extract text from a PDF file
router.post('/extract-text-pdf', upload.single('file'), (req, res) => {
  if (!req.file || path.extname(req.file.originalname) !== '.pdf') {
    return res.status(400).json({ error: "Please upload a PDF file." });
  }

  const pdfPath = path.join(UPLOADS_DIR, req.file.path);
  fs.readFile(pdfPath, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read PDF file." });
    }

    pdfParse(data)
      .then((pdfData) => {
        res.json({ text: pdfData.text });
      })
      .catch((pdfErr) => {
        console.error('Error extracting text from PDF:', pdfErr);
        res.status(500).json({ error: "Failed to extract text from PDF." });
      });
  });
});

// const sendFileNotifications = async (io, file, userId, username, departmentName) => {
//   try {
//     const user = await User.findById(userId).populate('communityDetails.communityId');
//     if (!user) return;

//     let community;
//     let recipients = [];

//     if (user.status === "member") {
//       if (user.communityDetails.length > 0) {
//         community = await Community.findById(user.communityDetails[0].communityId)
//           .populate('admin')
//           .populate('members');
        
//         if (community) {
//           // Add admin
//           recipients.push(community.admin._id.toString());
          
//           // Add other members (excluding the uploading user)
//           community.members.forEach(member => {
//             if (member._id.toString() !== userId.toString()) {
//               recipients.push(member._id.toString());
//             }
//           });
//         }
//       }
//     } else if (user.status === "community") {
//       community = await Community.findOne({ admin: userId })
//         .populate('members');
      
//       if (community) {
//         community.members.forEach(member => {
//           recipients.push(member._id.toString());
//         });
//       }
//     }

//     // Remove duplicates
//     recipients = [...new Set(recipients)];

//     if (recipients.length === 0) return;

//     // Create notification message
//     const message = `New file "${file.filename}" uploaded in department ${departmentName} by ${username}`;
    
//     await Promise.all(recipients.map(async recipientId => {
//       const notification = new Notification({
//         recipient: recipientId,
//         sender: userId,
//         message: message,
//         type: 'file',
//         relatedEntity: file._id,
//         read: false
//       });
      
//       await notification.save();
      
//       // Emit socket event to specific user's room
//       io.to(`user_${recipientId}`).emit('new-notification', {
//         ...notification.toObject(),
//         sender: {
//           _id: user._id,
//           username: user.username,
//           profileImage: user.profileImage
//         }
//       });
//     }));

//   } catch (error) {
//     console.error('Error sending file notifications:', error);
//   }
// };

module.exports = router;
