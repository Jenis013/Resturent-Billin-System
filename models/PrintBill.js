const mongoose = require('mongoose');

const PrintBillSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderHistory', // Reference to the original order
        required: true,
        unique: true // Ensures each order has only one printable bill entry
    },
    restaurantName: {
        type: String,
        required: true
    },
    dateTime: {
        type: Date,
        default: Date.now
    },
    customerName: String,
    customerMobile: String,
    items: [{
        name: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('PrintBill', PrintBillSchema);