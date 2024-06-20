const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
    guid: {
        type: String,
        required: true,
    },
    guid_company: {
        type: String,
        ref: 'companys',
        required: true
    },
    guid_user: {
        type: String,
        ref: 'users',
        required: true
    },
    name_user: {
        type: String,
        required: true,
    },
    location: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        // enum: ['hadir', 'sakit', 'izin'],
    },
    image: {
        type: String,
        // required: true
    },
    note: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

const Presence = mongoose.model('Presence', presenceSchema);

module.exports = Presence;
