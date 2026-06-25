const User = require("../models/User");

// Save Contacts
const saveContacts = async (req, res) => {
    try {

        const { userId, contacts } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { contacts },
            { new: true }
        );

        res.json({
            message: "Contacts saved successfully",
            contacts: user.contacts
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

// Get Contacts
const getContacts = async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        res.json(user.contacts);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};

module.exports = {
    saveContacts,
    getContacts
};