const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    guid:{
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'Super Admin'
    }
}, 
{
    timestamps: true
});

const Admin = mongoose.model('admins', adminSchema);

module.exports = Admin;