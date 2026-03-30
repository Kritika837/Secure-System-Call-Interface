require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const syscallRoutes = require('./routes/syscallRoutes');
const logRoutes = require('./routes/logRoutes');
const { authLimiter, apiLimiter } = require('./middlewares/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Database Connection
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('./models/User');

const startDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/syscall_logger', {
            serverSelectionTimeoutMS: 2000
        });
        console.log('Connected to MongoDB locally');
    } catch (err) {
        const path = require('path');
        const fs = require('fs');
        const dbPath = path.resolve(__dirname, 'tmp/mongodb-data');
        
        // Enable verbose diagnostics
        process.env.MONGOMS_DEBUG = '1';

        // Ensure clean, isolated folder for the in-memory instance
        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

        const mongoServer = await MongoMemoryServer.create({
            binary: {
                version: '4.4.18'
            },
            instance: {
                dbPath: dbPath,
                storageEngine: 'ephemeralForTest',
                args: ['--nojournal'] 
            }
        });

        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log(`Connected to In-Memory MongoDB (Isolated) at ${mongoUri}`);

        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            await User.create({ username: 'admin', password: 'adminpassword', role: 'Admin' });
            await User.create({ username: 'user', password: 'userpassword', role: 'User' });
            console.log('Seeded In-Memory DB with default admin and user.');
        }
    }
};

startDB().catch(console.error);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/syscall', apiLimiter, syscallRoutes);
app.use('/api/logs', apiLimiter, logRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
