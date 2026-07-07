const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');

// Load .env
dotenv.config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// ===== ROUTES =====
const userRoutes    = require('./routes/userRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const orderRoutes   = require('./routes/orderRoutes');
const contactRoutes = require('./routes/contactRoutes'); 

app.use('/api/users',   userRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/contact', contactRoutes); 

// ===== ROOT =====
app.get('/', (req, res) => {
    res.json({
        message: '🍔 FoodieHub API is running!',
        version: '1.0.0',
        endpoints: {
            userRegister:    'POST   /api/users/register',
            userLogin:       'POST   /api/users/login',
            userProfile:     'GET    /api/users/:id',
            userUpdate:      'PUT    /api/users/:id',
            adminLogin:      'POST   /api/admin/login',
            adminGetUsers:   'GET    /api/admin/users?page=1&limit=10',
            adminSearch:     'GET    /api/admin/users/search/:query',
            adminAddUser:    'POST   /api/admin/users',
            adminUpdateUser: 'PUT    /api/admin/users/:id',
            adminDeleteUser: 'DELETE /api/admin/users/:id',
            adminReport:     'GET    /api/admin/reports/users',
            contactMessage:  'POST   /api/contact',       
            contactGetAll:   'GET    /api/contact'        
        }
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ===== CONNECT MONGODB + START SERVER =====
const PORT      = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(' MongoDB Connected:', MONGO_URI);
        app.listen(PORT, () => {
            console.log(` Server running on http://localhost:${PORT}`);
            console.log(` API Docs: http://localhost:${PORT}/`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    });