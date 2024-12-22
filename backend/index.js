//  const express = require("express");
//  require ('dotenv').config();
//  const app = express();
//  const mongoose = require('mongoose');



//  // database
//  mongoose
//  .connect(process.env.MONGO_URL)
//  .then(()=> console.log('DB connected'))
//  .catch((err) => console.log("DB not connected"))

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000", // Allow requests from your frontend
}));

// Database connection
mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB not connected:", err));

// Routes
app.use("/api/auth", authRoutes);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


