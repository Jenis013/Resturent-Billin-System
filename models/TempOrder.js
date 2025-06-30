// models/TempOrder.js
const mongoose = require('mongoose');

const TempOrderSchema = new mongoose.Schema({
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
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu.items'
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        name: String,
        price: Number
    }],
    totalAmount: {
        type: Number
    },
    current: { //  Add the 'current' field
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('TempOrder', TempOrderSchema);