const databaseService = require("../../service/database");
const logger = require("../../util/logger");
const { v4: uuidv4 } = require("uuid");

class logController {
  async processData(channel, message) {
    const data = message.content.toString();
    const Message = data.split("#");

    const payload = {
      guid: uuidv4(),
      guid_device: Message[0],
      value: Message[1],
      ttimestamp: Math.round(new Date().getTime() / 1000).toString(),
    };

    try {
      await databaseService.saveLog(payload);
    } catch (error) {
      logger.error(error);
    }
  }
}

module.exports = new logController();
