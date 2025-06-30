// models/TableStatus.js
const mongoose = require('mongoose');

const TableStatusSchema = new mongoose.Schema({
    ownerId: {
        type: String,
        required: true,
        ref: 'Owner' // Assuming you have an Owner model
    },
    tables: { // Use a dynamic object to store table status
        type: Object,
        default: {}
    }
});

module.exports = mongoose.model('TableStatus', TableStatusSchema);