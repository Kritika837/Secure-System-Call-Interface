const { executeSystemCall } = require('../services/syscallWrapper');
const { logSystemCall } = require('../services/logger');

const executeCall = async (req, res) => {
    const { operation, parameters } = req.body;
    const username = req.user.username;
    const role = req.user.role;

    // RBAC Security Check
    const adminOnlyOperations = ['deleteFile', 'deleteDir', 'killProcess', 'renameFile', 'createDir', 'processList', 'createProcess'];
    if (adminOnlyOperations.includes(operation) && role !== 'Admin') {
        const errorMsg = 'SECURITY VIOLATION: Operation restricted to Administrator role only.';
        await logSystemCall(username, operation, parameters, 'failure', errorMsg);
        return res.status(403).json({ message: 'System call failed', error: errorMsg });
    }

    try {
        const result = await executeSystemCall(operation, parameters);
        await logSystemCall(username, operation, parameters, 'success');
        res.json({ result });
    } catch (err) {
        await logSystemCall(username, operation, parameters, 'failure', err.message);
        res.status(400).json({ message: 'System call failed', error: err.message });
    }
};

module.exports = { executeCall };
