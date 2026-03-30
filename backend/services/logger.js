const fs = require('fs');
const path = require('path');
const SystemLog = require('../models/SystemLog');

const logFilePath = path.join(__dirname, '../logs/log.txt');

if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

const logSystemCall = async (username, syscallName, parameters, status, errorMessage = null) => {
    const logEntryText = `[${new Date().toISOString()}] User: ${username} | Syscall: ${syscallName} | Params: ${JSON.stringify(parameters)} | Status: ${status} ${errorMessage ? '| Error: ' + errorMessage : ''}\n`;

    fs.appendFile(logFilePath, logEntryText, (err) => {
        if (err) console.error('Failed to write to log file', err);
    });

    try {
        await SystemLog.create({
            username,
            syscallName,
            parameters,
            status,
            errorMessage
        });
    } catch (err) {
        console.error('Failed to log to database', err);
    }
};

module.exports = { logSystemCall };
