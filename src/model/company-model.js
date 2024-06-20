const mongoose = require('mongoose');

function generateCode() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const companySchema = new mongoose.Schema({
    guid_company:{
        type: String,
        required: true,
    },
    code: {
        type: String,
        default: generateCode
    },
    name: {
        type: String,
        required: true,
    },
    address:{
        type: String,
        required: true,
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
    status: {
        type: Boolean,
        required: true
    },
    role: {
        type: String,
        default: 'Admin Company'
    }
}, 
{
    timestamps: true
});

const Company = mongoose.model('companys', companySchema);

module.exports = Company;