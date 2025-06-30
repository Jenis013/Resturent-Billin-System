// models/OrderHistory.js
const mongoose = require('mongoose');

const OrderHistorySchema = new mongoose.Schema({
    ownerId: {
        type: String,
        required: true,
        ref: 'Owner'
    },
    tableNumber: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerMobile: {
        type: String,
        required: true
    },
    orderTime: {
        type: Date,
        default: Date.now
    },
    items: [{  // Array of ordered items
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu.items' // Reference to a menu item
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        name: String, // Add name and price for redundancy
        price: Number
    }],
    totalAmount: {
        type: Number
    },
    current: { // Flag to track current/past orders
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('OrderHistory', OrderHistorySchema);