require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const nodemailer = require('nodemailer');
const surveyData = require('./utils/surveyData.json');

const app = express();

app.use(express.json());
app.use(cors());

// importing user context
const User = require("./model/user");

const auth = require("./middleware/auth");

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
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
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
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
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
    
    const secret = process.env.TOKEN_KEY + user.password
    const token = jwt.sign({ userId: user.id }, secret, {
      expiresIn: '600000'
    });

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
        <a href="${process.env.RESET_PASSWORD_URL}/reset-password/${token}">${process.env.RESET_PASSWORD_URL}/reset-password/${token}</a>
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

app.post('/reset-password/:id/:token', async (req, res) => {
    const { id, token } = req.params;

    const { password, confirm_password } = req.body

    const user = await User.findOne({ _id : id });

    if (!user) {
        return res.status(400).json({ message: 'Invalid User!! ' });
    }
    if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
    }
    const secret = process.env.TOKEN_KEY + user.password
    try {
        const decoded = jwt.verify(token, secret);
        
        if (password != confirm_password) {
            return res.status(400).json({ message: 'password and confirm password should match' });
        }
        const userId = decoded.userId;

        const user = await User.findOne({ _id : userId });

        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        encryptedPassword = await bcrypt.hash(password, 10);
        const data = await User.updateOne({_id:userId}, { $set: {password:encryptedPassword}})
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

    const { first_name, last_name, email, company, designation } = req.body
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
    
        const user = await User.findByIdAndUpdate(id, updateFields, { new: true });
    
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        res.status(200).json({ message: 'User sucessfully updated' });
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed to update user' });
      }
})

module.exports = app;