const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ FIXED: Serve files from CURRENT directory (NOT ../theme)
app.use(express.static(__dirname));

// Serve the contact page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "contact.html"));
});

app.get("/contact.html", (req, res) => {
  res.sendFile(path.join(__dirname, "contact.html"));
});

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL_USER or EMAIL_PASS not set!");
    return null;
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
};

// Email endpoint
app.post("/send-email", async (req, res) => {
  console.log("📨 Received submission:", req.body);
  
  const { name, email, message, number } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: "All fields required" 
    });
  }
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Email not configured");
    return res.status(500).json({ 
      success: false, 
      error: "Email service not configured" 
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
    to: "gurpreetsinghpctebtech20@gmail.com",
    replyTo: email,
    subject: "New Contact Form Message",
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${number || "Not provided"}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
  };
  
  try {
    await transporter.verify();
    console.log("✅ SMTP verified");
    
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
});