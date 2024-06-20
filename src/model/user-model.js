const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    guid_user:{
        type: String,
        required: true,
    },
    guid_company: {
        type: String,
        ref: 'companys'
    },
    guid_unit: {
        type: String,
        ref: 'units'
    },
    nik: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    profile_picture :{
        type: String,
    },
    gender :{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone_number:{
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        default: null
    },
    role: {
        type: String,
        default: 'User'
    }
}, 
{
    timestamps: true
});

const User = mongoose.model('users', userSchema);

module.exports = User;