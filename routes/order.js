// routes/order.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Menu = require('../models/Menu');
const OrderHistory = require('../models/Orderhistory');
const TableStatus = require('../models/TableStatus');

// GET menu by ownerId
router.get('/menu/:ownerId', auth, async (req, res) => {
    try {
        const menu = await Menu.findOne({ ownerId: req.params.ownerId });
        if (!menu) return res.status(404).json({ msg: 'Menu not found' });
        res.json(menu);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST order
router.post('/order', auth, async (req, res) => {
    const { ownerId, tableNumber, customerName, customerMobile, items, totalAmount } = req.body;
    try {
        const order = new OrderHistory({
            ownerId,
            tableNumber,
            customerName,
            customerMobile,
            items,
            totalAmount
        });
        await order.save();

        // Update table status to occupied (1)
        await TableStatus.updateOne(
            { ownerId },
            { $set: { [`tables.${tableNumber}`]: 1 } }
        );

        res.status(201).json({ msg: 'Order saved and table marked as occupied' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET existing order for table
router.get('/order/:ownerId/:tableNumber', auth, async (req, res) => {
    try {
        const { ownerId, tableNumber } = req.params;
        const order = await OrderHistory.findOne({ ownerId, tableNumber })
            .sort({ orderTime: -1 }); // Get latest
        if (!order) return res.status(404).json({ msg: 'No order found' });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
