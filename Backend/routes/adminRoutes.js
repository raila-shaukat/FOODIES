const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');

// Simple Admin Auth Middleware
// Checks header: x-admin-key = "admin123"

function adminAuth(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({
            success: false,
            errors: ['Unauthorized: Admin access required']
        });
    }
    next();
}

// Apply to all admin routes
router.use(adminAuth);


// POST /api/admin/login
// Admin Login (verify credentials)

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        return res.json({ success: true, message: 'Admin login successful' });
    }
    return res.status(401).json({ success: false, errors: ['Invalid admin credentials'] });
});


// GET /api/admin/users
// Get ALL users with Pagination + optional filter
// Query params: page, limit

router.get('/users', async (req, res) => {
    try {
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip  = (page - 1) * limit;

        const totalUsers = await User.countDocuments();
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            users,
            currentPage: page,
            totalPages:  Math.ceil(totalUsers / limit),
            totalUsers
        });

    } catch (err) {
        return res.status(500).json({ success: false, errors: [err.message] });
    }
});


// GET /api/admin/users/search/:query
// Search users by username, email, or name

router.get('/users/search/:query', async (req, res) => {
    try {
        const query = req.params.query.trim();

        const users = await User.find({
            $or: [
                { username:  { $regex: query, $options: 'i' } },
                { email:     { $regex: query, $options: 'i' } },
                { firstName: { $regex: query, $options: 'i' } },
                { lastName:  { $regex: query, $options: 'i' } },
                { phoneNumber: { $regex: query, $options: 'i' } }
            ]
        }).select('-password').sort({ createdAt: -1 });

        return res.status(200).json({ success: true, users });

    } catch (err) {
        return res.status(500).json({ success: false, errors: [err.message] });
    }
});


// POST /api/admin/users
// Admin creates a new user (INSERT)

router.post('/users', async (req, res) => {
    try {
        const {
            username, email, password,
            firstName, lastName, dateOfBirth, gender,
            phoneNumber, address, dietary_preferences, allergies, isActive
        } = req.body;

        const errors = [];
        if (!username || username.trim().length < 3)
            errors.push('Username must be at least 3 characters');
        if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
            errors.push('Invalid email format');
        if (!password || password.length < 6)
            errors.push('Password must be at least 6 characters');
        if (!firstName) errors.push('First name is required');
        if (!lastName)  errors.push('Last name is required');
        if (!dateOfBirth) errors.push('Date of birth is required');
        if (!gender)    errors.push('Gender is required');
        if (!phoneNumber || !/^\d{10,15}$/.test(phoneNumber))
            errors.push('Phone number must be 10-15 digits');

        if (errors.length > 0)
            return res.status(400).json({ success: false, errors });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            dateOfBirth, gender, phoneNumber,
            address: address || {},
            dietary_preferences: dietary_preferences || [],
            allergies: allergies || '',
            isActive: isActive !== undefined ? isActive : true
        });

        const saved = await newUser.save();
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: saved._id
        });

    } catch (err) {
        const field = err.code === 11000 ? Object.keys(err.keyValue)[0] : null;
        return res.status(400).json({
            success: false,
            errors: field
                ? [`${field} already exists`]
                : [err.message]
        });
    }
});


// PUT /api/admin/users/:id
// Admin updates ANY field of a user (full UPDATE)

router.put('/users/:id', async (req, res) => {
    try {
        const {
            firstName, lastName, phoneNumber, gender,
            dateOfBirth, address, allergies, dietary_preferences,
            isActive, password
        } = req.body;

        const updates = {};
        if (firstName   !== undefined) updates.firstName   = firstName.trim();
        if (lastName    !== undefined) updates.lastName    = lastName.trim();
        if (phoneNumber !== undefined) {
            if (!/^\d{10,15}$/.test(phoneNumber))
                return res.status(400).json({
                    success: false,
                    errors: ['Phone number must be 10-15 digits']
                });
            updates.phoneNumber = phoneNumber;
        }
        if (gender      !== undefined) updates.gender      = gender;
        if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
        if (address     !== undefined) updates.address     = address;
        if (allergies   !== undefined) updates.allergies   = allergies;
        if (dietary_preferences !== undefined) updates.dietary_preferences = dietary_preferences;
        if (isActive    !== undefined) updates.isActive    = isActive;
        if (password && password.length >= 6) {
            updates.password = await bcrypt.hash(password, 10);
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updated)
            return res.status(404).json({ success: false, errors: ['User not found'] });

        return res.json({ success: true, message: 'User updated successfully', user: updated });

    } catch (err) {
        return res.status(400).json({ success: false, errors: [err.message] });
    }
});


// DELETE /api/admin/users/:id
// Admin deletes a user (DELETE — users cannot do this)

router.delete('/users/:id', async (req, res) => {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id);

        if (!deleted)
            return res.status(404).json({ success: false, errors: ['User not found'] });

        return res.json({ success: true, message: 'User deleted successfully' });

    } catch (err) {
        return res.status(400).json({ success: false, errors: [err.message] });
    }
});

// GET /api/admin/reports/users
// Generate user statistics report

router.get('/reports/users', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            activeUsers,
            usersThisMonth,
            usersByGender,
            usersByDiet
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
            User.aggregate([
                { $group: { _id: '$gender', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            User.aggregate([
                { $unwind: { path: '$dietary_preferences', preserveNullAndEmptyArrays: true } },
                { $group: { _id: '$dietary_preferences', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        return res.json({
            success: true,
            report: {
                totalUsers,
                activeUsers,
                inactiveUsers: totalUsers - activeUsers,
                usersThisMonth,
                usersByGender,
                usersByDiet
            }
        });

    } catch (err) {
        return res.status(500).json({ success: false, errors: [err.message] });
    }
});

module.exports = router;