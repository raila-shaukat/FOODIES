const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');

function getValidationErrors(err) {
    if (err.name === 'ValidationError') {
        return Object.values(err.errors).map(e => e.message);
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return [`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`];
    }
    return [err.message];
}

router.post('/register', async (req, res) => {
    try {
        const {
            username, email, password,
            firstName, lastName, dateOfBirth, gender,
            phoneNumber, address,
            dietary_preferences, allergies
        } = req.body;

        const errors = [];
        if (!username || username.trim().length < 3)
            errors.push('Username must be at least 3 characters');
        if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
            errors.push('Invalid email format');
        if (!password || password.length < 6)
            errors.push('Password must be at least 6 characters');
        if (!firstName || firstName.trim() === '')
            errors.push('First name is required');
        if (!lastName || lastName.trim() === '')
            errors.push('Last name is required');
        if (!dateOfBirth)
            errors.push('Date of birth is required');
        if (!gender)
            errors.push('Gender is required');
        if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber))
            errors.push('Phone number must be 10-15 digits (numbers only)');

    

        if (errors.length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username:            username.trim(),
            email:               email.trim().toLowerCase(),
            password:            hashedPassword,
            firstName:           firstName.trim(),
            lastName:            lastName.trim(),
            dateOfBirth,
            gender,
            phoneNumber,
            address:             address || {},  
            dietary_preferences: dietary_preferences || [],
            allergies:           allergies || ''
        });

        const savedUser = await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: {
                _id:         savedUser._id,
                username:    savedUser.username,
                email:       savedUser.email,
                firstName:   savedUser.firstName,
                lastName:    savedUser.lastName,
                phoneNumber: savedUser.phoneNumber,
                dateOfBirth: savedUser.dateOfBirth,
                gender:      savedUser.gender,
                address:     savedUser.address,
                isActive:    savedUser.isActive,
                createdAt:   savedUser.createdAt
            }
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            errors: getValidationErrors(err)
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                errors: ['Username/email and password are required']
            });
        }

        const user = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: username.trim().toLowerCase() }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                errors: ['Invalid username/email or password']
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                errors: ['Your account has been deactivated. Contact admin.']
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                errors: ['Invalid username/email or password']
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            user: {
                _id:         user._id,
                username:    user.username,
                email:       user.email,
                firstName:   user.firstName,
                lastName:    user.lastName,
                phoneNumber: user.phoneNumber,
                dateOfBirth: user.dateOfBirth,
                gender:      user.gender,
                address:     user.address,
                dietary_preferences: user.dietary_preferences,
                allergies:   user.allergies,
                isActive:    user.isActive,
                createdAt:   user.createdAt
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            errors: ['Server error: ' + err.message]
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                errors: ['User not found']
            });
        }

        return res.status(200).json({ success: true, user });

    } catch (err) {
        return res.status(400).json({
            success: false,
            errors: ['Invalid user ID or server error']
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {
            username, email,
            firstName, lastName,
            dateOfBirth, gender,
            phoneNumber, allergies, address,
            dietary_preferences, isActive
        } = req.body;

        const errors = [];
        if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber))
            errors.push('Phone number must be 10-15 digits');
        if (errors.length > 0)
            return res.status(400).json({ success: false, errors });

        const allowedUpdates = {};
        if (username)                        allowedUpdates.username   = username.trim();
        if (email)                           allowedUpdates.email      = email.trim().toLowerCase();
        if (firstName)                       allowedUpdates.firstName  = firstName.trim();
        if (lastName)                        allowedUpdates.lastName   = lastName.trim();
        if (dateOfBirth)                     allowedUpdates.dateOfBirth = dateOfBirth;
        if (gender)                          allowedUpdates.gender     = gender;
        if (phoneNumber)                     allowedUpdates.phoneNumber = phoneNumber;
        if (allergies !== undefined)         allowedUpdates.allergies  = allergies;
        if (dietary_preferences !== undefined) allowedUpdates.dietary_preferences = dietary_preferences;
        if (isActive !== undefined)          allowedUpdates.isActive   = isActive;

        
        if (address) {
            if (address.street  !== undefined) allowedUpdates['address.street']  = address.street;
            if (address.city    !== undefined) allowedUpdates['address.city']    = address.city;
            if (address.state   !== undefined) allowedUpdates['address.state']   = address.state;
            if (address.zipCode !== undefined) allowedUpdates['address.zipCode'] = address.zipCode;
            if (address.country !== undefined) allowedUpdates['address.country'] = address.country;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: allowedUpdates },
            { new: true, runValidators: false }  
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, errors: ['User not found'] });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            user: updatedUser
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            errors: getValidationErrors(err)
        });
    }
});

module.exports = router;