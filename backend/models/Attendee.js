const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
});

module.exports = mongoose.model("Attendee", AttendeeSchema);
