const express = require('express');
const router = express.Router();

const Order = require('../models/Order');


// ================= CREATE ORDER =================

router.post('/', async (req, res) => {

    try {

        const { customer, items, total } = req.body;

        if (!customer || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                errors: ['Invalid order data']
            });
        }

       const newOrder = new Order({
    customer,
    items,
    total: Number(total)
});

        const savedOrder = await newOrder.save();

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: savedOrder
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            errors: [err.message]
        });

    }

});


// ================= GET ALL ORDERS =================

router.get('/', async (req, res) => {

    try {

        const orders = await Order.find()
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            errors: [err.message]
        });

    }

});

module.exports = router;