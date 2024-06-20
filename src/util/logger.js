const moment = require('moment')
const Logger = function () { }


Logger.prototype.info = function (logText) {
    console.log(`[${moment().format('DD-MM-YYYY hh:mm:ss')}] Info: ${logText}`)
};

Logger.prototype.error = function (logText) {
    console.log(`[${moment().format('DD-MM-YYYY hh:mm:ss')}] Error: ${logText}`)
};

module.exports = new Logger()