const logModel = require("../../model/log_model");
const logger = require("../../util/logger");

class databaseService {
  async saveLog(payload) {
    try {
      await logModel.create(payload);
      logger.info("success save data...");
    } catch (error) {
      logger.error(error);
    }
  }
}

module.exports = new databaseService();
