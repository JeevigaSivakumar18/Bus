const express = require("express");

const router = express.Router();

const {
  saveTrip,
  getTrips,
} = require("../controllers/tripController");

router.post("/", saveTrip);

router.get("/:userId", getTrips);

module.exports = router;