const Trip = require("../models/Trips");

const saveTrip = async (req, res) => {
  try {

    const trip = await Trip.create(req.body);

    res.status(201).json(trip);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

const getTrips = async (req, res) => {

  try {

    const trips = await Trip.find({
      user: req.params.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(trips);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }

};

module.exports = {
  saveTrip,
  getTrips,
};