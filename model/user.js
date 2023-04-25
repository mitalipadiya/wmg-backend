const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  email: { type: String, unique: true },
  company: {type: String},
  designation: { type: String},
  password: { type: String },
  token: { type: String },
  survey_data: { type: Object}
});

module.exports = mongoose.model("user", userSchema);