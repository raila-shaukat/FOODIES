const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
{
    customer: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },

    items: [
        {
            name: String,
            price: String,
            image: String
        }
    ],

    total: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Delivered'],
        default: 'Pending'
    }
},
{
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);