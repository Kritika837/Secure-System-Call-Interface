const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logSystemCall } = require('../services/logger');

const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const exists = await User.findOne({ username });
        if (exists) {
            await logSystemCall(username || 'UNKNOWN', 'AUTH_REGISTER', { role }, 'failure', 'User already exists');
            return res.status(400).json({ message: 'User already exists. Duplicate registration prevented.' });
        }

        const user = new User({ username, password, role: role || 'User' });
        await user.save();
        await logSystemCall(username, 'AUTH_REGISTER', { role: user.role }, 'success', null);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        await logSystemCall(req.body.username || 'UNKNOWN', 'AUTH_REGISTER', {}, 'failure', err.message);
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            await logSystemCall(username || 'UNKNOWN', 'AUTH_LOGIN', {}, 'failure', 'Invalid credentials');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await logSystemCall(username, 'AUTH_LOGIN', {}, 'failure', 'Invalid credentials');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '2h' }
        );

        await logSystemCall(username, 'AUTH_LOGIN', {}, 'success', null);
        res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        await logSystemCall(req.body.username || 'UNKNOWN', 'AUTH_LOGIN', {}, 'failure', err.message);
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};

module.exports = { register, login };
