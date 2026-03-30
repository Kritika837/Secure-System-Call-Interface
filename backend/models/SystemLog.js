const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    username: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    syscallName: { type: String, required: true },
    parameters: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['success', 'failure'], required: true },
    errorMessage: { type: String }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
