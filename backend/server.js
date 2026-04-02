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
app.use(express.static(path.join(__dirname, "theme")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "theme", "index.html"));
});

// 🔐 Gmail SMTP (SECURE - no password in code)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// API Route
app.post("/send-email", async (req, res) => {
  const { name, email, message, number } = req.body;

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: "rajkumar37429@gmail.com",
    replyTo: email, // ✅ FIXED
    subject: "New Contact Form Message",
    html: `
      <h2>New Contact Message</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone-No:</b> ${number}</p>
      <p><b>Message:</b><br>${message}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});

// ✅ IMPORTANT (for Render)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});