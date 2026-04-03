const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Serve frontend (theme folder)
app.use(express.static(path.join(__dirname, "../theme")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "theme", "index.html"));
});

// Create transporter with better configuration
const createTransporter = () => {
  // Check if environment variables exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL_USER or EMAIL_PASS not set!");
    return null;
  }
  
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
    // Important for Render
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email sending endpoint
app.post("/send-email", async (req, res) => {
  console.log("📨 Received contact form submission");
  console.log("Request body:", req.body);
  
  const { name, email, message, number } = req.body;
  
  // Validate required fields
  if (!name || !email || !message) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ 
      success: false, 
      error: "Name, email, and message are required" 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format"
    });
  }
  
  // Check configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Email not configured on server");
    return res.status(500).json({ 
      success: false, 
      error: "Email service not configured. Please contact administrator." 
    });
  }
  
  const transporter = createTransporter();
  
  if (!transporter) {
    return res.status(500).json({
      success: false,
      error: "Email service initialization failed"
    });
  }
  
  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: "gurpreetsinghpctebtech20@gmail.com", // Change to your email
    replyTo: email,
    subject: "New Contact Form Message - Logicraft",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 10px; }
          .content { margin: 20px 0; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #333; }
          .value { margin-left: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Name:</span>
              <span class="value">${name}</span>
            </div>
            <div class="field">
              <span class="label">Email:</span>
              <span class="value">${email}</span>
            </div>
            <div class="field">
              <span class="label">Phone:</span>
              <span class="value">${number || "Not provided"}</span>
            </div>
            <div class="field">
              <span class="label">Message:</span>
              <div class="value">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <hr>
          <p><small>Sent from Logicraft Website Contact Form</small></p>
        </div>
      </body>
      </html>
    `,
    text: `New Contact Message:\n\nName: ${name}\nEmail: ${email}\nPhone: ${number || "Not provided"}\n\nMessage:\n${message}`
  };
  
  try {
    // Verify transporter connection first
    await transporter.verify();
    console.log("✅ SMTP connection verified");
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
    
    res.json({ 
      success: true, 
      message: "Email sent successfully",
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    console.error("Full error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to send email";
    if (error.code === 'EAUTH') {
      errorMessage = "Email authentication failed. Please check your app password.";
    } else if (error.code === 'ECONNECTION') {
      errorMessage = "Cannot connect to email server. Please try again later.";
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = "Connection timeout. Please try again.";
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: error.code 
    });
    
  } finally {
    transporter.close();
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    emailUser: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + "***" : "Not set",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    success: false, 
    error: "Internal server error" 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  if (process.env.EMAIL_USER) {
    console.log(`📧 Using email: ${process.env.EMAIL_USER.substring(0, 5)}***`);
    console.log(`📧 Sending to: gurpreetsinghpctebtech20@gmail.com`);
  } else {
    console.warn("⚠️ WARNING: EMAIL_USER and EMAIL_PASS environment variables not set!");
    console.warn("⚠️ Please add them in Render Dashboard → Environment");
  }
});