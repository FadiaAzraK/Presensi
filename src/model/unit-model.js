const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
    guid_unit: {
        type: String,
        required: true
    },
    guid_company: {
        type: String,
        ref: 'companys'
    },
    name: {
        type: String,
        required: true,
    },
    entry: {
        type: String,
        required: true
    },
    exit: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Unit = mongoose.model('units', unitSchema);

module.exports = Unit;
