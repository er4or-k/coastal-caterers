import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import config from "./config.js";

const app = express();
const PORT = 5000;

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());

/* DEBUG ENV */
console.log("EMAIL_USER =", config.EMAIL_USER);
console.log(
  "EMAIL_PASS =",
  config.EMAIL_PASS ? "LOADED" : "MISSING"
);
console.log("ADMIN_EMAIL =", config.ADMIN_EMAIL);

/* MAIL TRANSPORTER */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

/* VERIFY TRANSPORTER */
transporter.verify((err) => {
  if (err) {
    console.error("❌ Email transporter error:", err);
  } else {
    console.log("✅ Email transporter ready");
  }
});

/* BOOKING API */
app.post("/api/book", async (req, res) => {
  try {
    const body = req.body || {};
    const { service, items, customer } = body;

    /* 🔒 HARD VALIDATION (IMPORTANT) */
    if (
      !customer ||
      typeof customer !== "object" ||
      !customer.name ||
      !customer.phone ||
      !customer.email
    ) {
      return res.status(400).json({
        message: "Invalid booking data received",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "No menu items selected",
      });
    }

    const mailOptions = {
      from: `"Coastal Caterers" <${config.EMAIL_USER}>`,
      to: config.ADMIN_EMAIL,
      subject: `📌 New Booking – ${service || "Service"}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>🍽️ New Catering Booking</h2>

          <p><b>Name:</b> ${customer.name}</p>
          <p><b>Phone:</b> ${customer.phone}</p>
          <p><b>Email:</b> ${customer.email}</p>
          <p><b>Event Date:</b> ${customer.date || "Not specified"}</p>

          <hr />

          <h3>Service</h3>
          <p>${service}</p>

          <h3>Selected Menu Items</h3>
          <ul>
            ${items.map((i) => `<li>${i}</li>`).join("")}
          </ul>

          <h3>Additional Message</h3>
          <p>${customer.message || "None"}</p>

          <hr />
          <p style="font-size: 12px; color: #777">
            Sent from Coastal Caterers website
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("❌ Email failed:", err);
    res.status(500).json({ message: "Email failed to send" });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});