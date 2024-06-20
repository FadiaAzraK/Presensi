const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    guid: {
      type: String,
      required: true,
    },
    guid_device: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
    },
    value: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

const LogModel = mongoose.model("logDataSensor", LogSchema);

module.exports = LogModel;
