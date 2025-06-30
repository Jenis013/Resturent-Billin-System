const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
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
    mobile: {  // New field
        type: String,
        validate: {
            validator: function (v) {
                return /^[0-9]{10}$/.test(v); // Simple 10-digit validation
            },
            message: 'Mobile number must be 10 digits'
        }
    },
    age: {     // New field
        type: Number
    },
    address: { // New field
        type: String
    },
    role: {
        type: String,
        default: 'employee'
    },
    ownerId: {
        type: String
    }
});

module.exports = mongoose.model('Employee', employeeSchema);