const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const {
  saveContacts,
  getContacts,
} = require("../controllers/emergencyController");


router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/emergency", saveContacts);

router.get("/emergency/:userId", getContacts);

module.exports = router;