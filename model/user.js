const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  email: { type: String, unique: true },
  company: {type: String},
  designation: { type: String},
  management_level_Current_position: { type: String},
  current_function: {type: String},
  company_country: {type: String},
  company_city: {type: String},
  industry_company_operates: {type: String},
  company_turnover: {type: String},
  customer_nature: {type: String},
  business_value_drivers: {type: Array},
  industry_recognised_accreditations: {type: Array},
  other_recognised_accreditations: {type: String},
  password: { type: String },
  token: { type: String },
  survey_data: { type: Object}
});

module.exports = mongoose.model("user", userSchema);