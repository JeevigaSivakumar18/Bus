const User = require("../models/User");

// Save emergency contacts
const saveContacts = async (req, res) => {
  try {
    const { userId, contacts } = req.body;

    console.log("saveContacts called with userId:", userId);
    console.log("contacts:", contacts);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ message: "contacts array is empty" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // BUG FIX: was saving to user.contacts (wrong field)
    // Must match the field name in your User schema
    user.emergencyContacts = contacts;

    await user.save();

    console.log("Contacts saved successfully for user:", userId);

    res.json({ message: "Contacts saved successfully" });

  } catch (err) {
    console.log("saveContacts error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get emergency contacts
const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.emergencyContacts || []);

  } catch (err) {
    console.log("getContacts error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { saveContacts, getContacts };