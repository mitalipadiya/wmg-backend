require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const nodemailer = require('nodemailer');
const fetchData = require('./utils/excel_to_json');

const app = express();

app.use(express.json());
app.use(cors());

// importing user context
const User = require("./model/user");

const auth = require("./middleware/auth");
const CRED = {
  "type": process.env.TYPE,
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER,
  "client_x509_cert_url": process.env.CLIENT_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN
}
app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome");
});

// Register
app.post("/register", async (req, res) => {

    // Our register logic starts here
    try {
        // Get user input
        const { first_name, last_name, email, company, designation, password } = req.body;

        // Validate user input
        if (!(email && password && first_name && last_name && company && designation)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);
        const surveyData = await fetchData(CRED);

        // Create user in our database
        const user = await User.create({
            first_name,
            last_name,
            company,
            designation,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
            survey_data: surveyData
        });

        // Create token
        const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY
        );
        // save user token
        user.token = token;

        // return new user
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
    // Our register logic ends here
});

app.post("/login", async (req, res) => {

    // Our login logic starts here
    try {
        // Get user input
        const { email, password } = req.body;

        // Validate user input
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }
        // Validate if user exist in our database
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY
            );

            // save user token
            user.token = token;

            // user
            res.status(200).json(user);
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
    // Our register logic ends here
});

app.post('/forgot-password', async (req, res) => {;
    const { email } = req.body;
  
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const secret = process.env.TOKEN_KEY;
    const token = jwt.sign({ userId: user.id }, secret);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: 'Reset your password',
      html: `
        <p>Please click the link below to reset your password</p>
        <a href="${process.env.RESET_PASSWORD_URL}/create-new/${token}">${process.env.RESET_PASSWORD_URL}/create-new/${token}</a>
      `
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: 'Failed to send email' });
      }
  
      console.log(`Email sent: ${info.response}`);
      res.json({ message: 'Email sent successfully' });
    });
});

app.post('/reset-password', auth, async (req, res) => {
    const { userId } = req.user;

    const { password } = req.body;

    const user = await User.findOne({ _id : userId });

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }
    try {
        encryptedPassword = await bcrypt.hash(password, 10);
        const data = await User.updateOne({_id: userId}, { $set: {password:encryptedPassword}})
        if(!data) {
            return res.status(200).json({ message: 'Password updated Succesfully'})
        } else {
            return res.status(200).json({ message: 'Password updated Succesfully'})
        }
        
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.put('/update-profile/:id',auth, async (req, res) => {
    const { id } = req.params;

    const { first_name, last_name, email, company, designation, management_level_Current_position,
            current_function, company_country, company_city, 
            industry_company_operates,company_turnover, customer_nature,
            business_value_drivers, industry_recognised_accreditations, 
            other_recognised_accreditations} = req.body
    try {
        // Create an object with the fields to update
        const updateFields = {};
        if (first_name) {
          updateFields.first_name = first_name;
        }
        if (last_name) {
          updateFields.last_name = last_name;
        }
        if (email) {
          updateFields.email = email;
        }
        if (company) {
          updateFields.company = company;
        }
        if (designation) {
          updateFields.designation = designation;
        }
        if (management_level_Current_position) {
          updateFields.management_level_Current_position = management_level_Current_position;
        }
        if (current_function) {
          updateFields.current_function = current_function;
        }
        if (company_country) {
          updateFields.company_country = company_country;
        }
        if (company_city) {
          updateFields.company_city = company_city;
        }
        if (industry_company_operates) {
          updateFields.industry_company_operates = industry_company_operates;
        }
        if (company_turnover) {
          updateFields.company_turnover = company_turnover;
        }
        if (customer_nature) {
          updateFields.customer_nature = customer_nature;
        }
        if (business_value_drivers) {
          updateFields.business_value_drivers = business_value_drivers;
        }
        if (industry_recognised_accreditations) {
          updateFields.industry_recognised_accreditations = industry_recognised_accreditations;
        }
        if (other_recognised_accreditations) {
          updateFields.other_recognised_accreditations = other_recognised_accreditations;
        }
    
        const user = await User.findByIdAndUpdate(id, updateFields, { new: true });
    
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        res.status(200).json({ message: 'User sucessfully updated' });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to update user' });
      }
});

app.put('/surveyResponse/:id', auth, async (req, res) =>{
    
  const { id } = req.params;
  const surveyResponse = req.body

  try {
    const updateFields = {};

    if (surveyResponse && surveyResponse.categories) {

      updateFields.survey_data = surveyResponse

      const user = await User.findByIdAndUpdate(id, updateFields, { new: true });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ message: 'Survey Data updated sucessfully' });
    } else {

      res.status(404).json({ message: 'Survey Response not found' });
    }
  } catch (error) {

    console.log(error);

    res.status(500).json({ message: 'Failed to update user' });
  }

})

module.exports = app;