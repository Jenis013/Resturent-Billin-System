// models/Menu.js
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

const menuSchema = new mongoose.Schema({
    ownerId: {
        type: String,
        required: true,
        ref: 'Owner'  // Reference to the Owner model
    },
    items: [menuItemSchema] // Array of menu items
});

module.exports = mongoose.model('Menu', menuSchema);