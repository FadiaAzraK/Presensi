const logger = require("../../util/logger");

class RMQ {
  async publishToRabbitMQ(channel, payload) {
    try {
      const queueName = process.env.QUEUE_NAME;
      await channel.assertQueue(queueName, { durable: true });
      await channel.sendToQueue(
        queueName,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
      );

      logger.info("Message published to RabbitMQ", payload);
    } catch (error) {
      console.log(error);
      logger.error("Error publishing message to RabbitMQ", error);
    }
  }
}

module.exports = new RMQ();
