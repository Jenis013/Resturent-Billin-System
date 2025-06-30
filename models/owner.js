// owner.js
const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema({
    ownerId: { // Add ownerId field
        type: String, // Store as String!
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
    restaurantName: {
        type: String,
        required: true
    },
    noOfTables: { // New field for number of tables
        type: Number,
        required: true
    },
    role: {  // Add role field
        type: String,
        default: 'owner'
    },
    tables: {  //  Embedded object to store table status
        type: Map,
        of: Number,
        default: {}
    },
    employeeIds: [{ type: String }] // Array of employeeIds
});

module.exports = mongoose.model('Owner', ownerSchema);