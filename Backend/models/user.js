const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        // ===== ACCOUNT INFO =====
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters']
        },

        // ===== PERSONAL INFO =====
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required']
        },
        gender: {
            type: String,
            required: [true, 'Gender is required'],
            enum: ['Male', 'Female', 'Other']
        },

        // ===== CONTACT INFO =====
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^\d{10,15}$/, 'Phone number must be 10-15 digits']
        },

        // ===== ADDRESS =====
        address: {
             street:  { type: String },
            city:    { type: String },
            state:   { type: String },
            zipCode: { type: String },
            country: { type: String }
        },
        // ===== OPTIONAL =====
        dietary_preferences: {
            type: [String],
            enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'],
            default: []
        },
        allergies: {
            type: String,
            trim: true,
            default: ''
        },

        // ===== ADMIN MANAGED =====
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true  // createdAt, updatedAt automatic
    }
);

module.exports = mongoose.model('User', userSchema);