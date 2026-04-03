const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// Only try to load dotenv if in development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (err) {
    console.log("dotenv not available in production");
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Serve files from the theme folder
const themePath = path.join(__dirname, "../theme");
app.use(express.static(themePath));

// Serve the contact page from theme folder
app.get("/", (req, res) => {
  res.sendFile(path.join(themePath, "contact.html"));
});

app.get("/contact.html", (req, res) => {
  res.sendFile(path.join(themePath, "contact.html"));
});

// Also serve any other HTML pages
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(themePath, "index.html"));
});

app.get("/about.html", (req, res) => {
  res.sendFile(path.join(themePath, "about.html"));
});

app.get("/service.html", (req, res) => {
  res.sendFile(path.join(themePath, "service.html"));
});

app.get("/gallery.html", (req, res) => {
  res.sendFile(path.join(themePath, "gallery.html"));
});

// Create transporter
const createTransporter = () => {
  // Check for environment variables (from Render dashboard)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EMAIL_USER or EMAIL_PASS not set!");
    console.log("Available env vars:", Object.keys(process.env));
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
    to: "gurpreetsinghpctebtech20@gmail.com",
    replyTo: email,
    subject: "New Contact Form Message - Logicraft",
    html: `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${number || "Not provided"}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>Sent from Logicraft Website</small></p>
    `
  };
  
  try {
    await transporter.verify();
    console.log("✅ SMTP verified");
    
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = "Email authentication failed. Check your app password.";
    } else if (error.code === 'ECONNECTION') {
      errorMessage = "Cannot connect to email server.";
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    emailUser: process.env.EMAIL_USER ? "Configured" : "Not configured",
    themePath: themePath,
    uptime: process.uptime(),
    nodeEnv: process.env.NODE_ENV || "development"
  });
});

// Handle 404 for any other routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(themePath, "404.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${themePath}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  if (process.env.EMAIL_USER) {
    console.log(`📧 Using email: ${process.env.EMAIL_USER}`);
  }
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});