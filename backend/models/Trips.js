const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
   {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    from: {
      type: String,
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    distance: {
      type: Number,
      required: true,
    },

    alarmDistance: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports= mongoose.model("Trip",tripSchema);