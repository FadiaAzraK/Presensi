const amqp = require("amqplib");
const mongoose = require("mongoose");
require('dotenv').config();

async function RabbitMConnection() {
  try {
    const connectionString = `amqp://${process.env.RMQ_USER}:${process.env.RMQ_PASS}@${process.env.RMQ_HOST}`;
    const connection = await amqp.connect(connectionString + '//' + process.env.RMQ_VHOST);
    const channel = await connection.createChannel();
    console.log("Connected to RabbitMQ Broker...");
    return channel;
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error.message);
    throw error;
  }
}

async function connectToMongoDB() {
  try {
    const uri = process.env.DATABASE;
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Database...");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
}

module.exports = {
  RabbitMConnection,
  connectToMongoDB,
};
