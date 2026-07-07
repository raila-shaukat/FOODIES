const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Middleware to parse JSON (ensure this is also in main app.js)
router.use(express.json());

// POST /api/contact — Save contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    const errors = [];
    if (!name?.trim()) errors.push('Name is required');
    if (!email?.trim()) errors.push('Email is required');
    if (!message?.trim()) errors.push('Message is required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Save to MongoDB
    const newContact = new Contact({ name, email, message });
    const savedContact = await newContact.save();

    // Confirm save
    if (!savedContact) {
      return res.status(500).json({
        success: false,
        errors: ['Failed to save message to database'],
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: savedContact,
    });
  } catch (err) {
    console.error('Error saving contact message:', err);
    return res.status(500).json({ success: false, errors: [err.message] });
  }
});

// GET /api/contact — Get all messages (admin only)
router.get('/', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ success: false, errors: [err.message] });
  }
});

module.exports = router;
