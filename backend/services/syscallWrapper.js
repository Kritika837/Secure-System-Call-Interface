const path = require('path');
const fs = require('fs');

let nativeSyscalls;
try {
    // Attempt to load the native C++ module
    nativeSyscalls = require('../build/Release/syscalls.node');
    console.log('[Native] Successfully loaded C++ system call module.');
} catch (err) {
    console.error('[Native Error] Failed to load native C++ addon. Ensure you have run "npx node-gyp rebuild".');
    console.error('[Native Error] Performance and direct OS access will be limited.');
}

const allowedOperations = [
    'readFile', 
    'writeFile', 
    'listDir', 
    'createFile',
    'deleteFile',
    'createDir',
    'deleteDir',
    'renameFile',
    'processList',
    'createProcess',
    'killProcess'
];

// Ensure sandbox directory exists
const SANDBOX_DIR = path.resolve(__dirname, '../sandbox');
if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

/**
 * Normalizes and verifies a path to ensure it cannot escape the secure sandbox.
 */
const validateAndSandboxPath = (inputPath) => {
    if (!inputPath || typeof inputPath !== 'string') {
         throw new Error('Invalid path provided.');
    }
    
    if (inputPath.includes('..') || path.isAbsolute(inputPath)) {
         // Check if it's an absolute path that's actually inside our sandbox (Windows quirk handling)
         const normalizedInput = path.normalize(inputPath);
         const normalizedSandbox = path.normalize(SANDBOX_DIR);
         if (!normalizedInput.toLowerCase().startsWith(normalizedSandbox.toLowerCase())) {
            throw new Error('SECURITY VIOLATION: Path traversal or absolute paths outside sandbox are forbidden.');
         }
         return normalizedInput;
    }

    const resolvedPath = path.resolve(SANDBOX_DIR, inputPath);
    
    if (!resolvedPath.startsWith(SANDBOX_DIR)) {
         throw new Error('SECURITY VIOLATION: Path resolves outside of the sandbox matrix.');
    }

    return resolvedPath;
};

const executeSystemCall = (operation, parameters) => {
    // Helper to get parameters case-insensitively
    const p = (key) => parameters[key] || parameters[key.toLowerCase()];

    return new Promise((resolve, reject) => {
        if (!allowedOperations.includes(operation)) {
            return reject(new Error('Unauthorized or unknown system call'));
        }

        if (!nativeSyscalls) {
            return reject(new Error('Native C++ backend not available. Please run "npx node-gyp rebuild" in the backend directory.'));
        }

        try {
            switch (operation) {
                case 'readFile': {
                    const filePath = p('filePath');
                    if (!filePath) return reject(new Error('Missing filePath'));
                    
                    // Decode URL-encoded spaces (%20) if present from terminal input
                    const decodedPath = filePath.includes('%') ? decodeURIComponent(filePath) : filePath;
                    
                    const safePath = validateAndSandboxPath(decodedPath);
                    const contents = nativeSyscalls.readFile(safePath);
                    
                    // Detect PDF binary data
                    if (Buffer.isBuffer(contents)) {
                        const ext = path.extname(safePath).toLowerCase();
                        if (ext === '.pdf') {
                            return resolve({
                                type: 'binary/pdf',
                                filename: path.basename(safePath),
                                content: contents.toString('base64'),
                                size: contents.length
                            });
                        }
                        // Default to string for text-like files, but keep buffer for others if needed
                        return resolve(contents.toString('utf8'));
                    }
                    
                    resolve(contents);
                    break;
                }
                
                case 'writeFile':
                case 'createFile': {
                    const fp = p('filePath');
                    if (!fp) return reject(new Error('Missing filePath'));
                    const safePath = validateAndSandboxPath(fp);
                    const content = p('content') || '';
                    const result = nativeSyscalls.writeFile(safePath, String(content));
                    resolve(result);
                    break;
                }

                case 'deleteFile': {
                    const filePath = p('filePath');
                    if (!filePath) return reject(new Error('Missing filePath'));
                    const safePath = validateAndSandboxPath(filePath);
                    nativeSyscalls.deleteFile(safePath);
                    resolve('File deleted successfully via native call');
                    break;
                }

                case 'createDir': {
                    const dirPath = p('dirPath');
                    if (!dirPath) return reject(new Error('Missing dirPath'));
                    const safePath = validateAndSandboxPath(dirPath);
                    nativeSyscalls.createDir(safePath);
                    resolve('Directory created successfully via native call');
                    break;
                }

                case 'deleteDir': {
                    const dirPath = p('dirPath');
                    if (!dirPath) return reject(new Error('Missing dirPath'));
                    const safePath = validateAndSandboxPath(dirPath);
                    nativeSyscalls.deleteDir(safePath);
                    resolve('Directory deleted successfully via native call');
                    break;
                }

                case 'renameFile': {
                    const oldPathValue = p('oldPath');
                    const newPathValue = p('newPath');
                    if (!oldPathValue || !newPathValue) return reject(new Error('Missing oldPath or newPath'));
                    
                    const safeOldPath = validateAndSandboxPath(oldPathValue);
                    const safeNewPath = validateAndSandboxPath(newPathValue);
                    
                    nativeSyscalls.renameFile(safeOldPath, safeNewPath);
                    resolve('File renamed successfully via native call');
                    break;
                }

                case 'listDir': {
                    const dirPath = p('dirPath');
                    const safePath = dirPath ? validateAndSandboxPath(dirPath) : SANDBOX_DIR;
                    const files = nativeSyscalls.listDir(safePath);
                    resolve(files.length > 0 ? files.join('\n') : 'Directory is empty');
                    break;
                }

                case 'createProcess': {
                    const command = p('command');
                    if (!command) return reject(new Error('Missing command'));
                    const cmd = String(command);
                    
                    // Keep basic security checks in JS
                    if (/[&|;><]/.test(cmd)) {
                        return reject(new Error('SECURITY VIOLATION: Command chaining and redirection blocked.'));
                    }

                    const pid = nativeSyscalls.createProcess(cmd);
                    resolve(`Process started natively with PID: ${pid}`);
                    break;
                }

                case 'killProcess': {
                    const pid = p('pid');
                    if (!pid) return reject(new Error('Missing pid'));
                    const pidNum = parseInt(pid, 10);
                    if (isNaN(pidNum)) return reject(new Error('Invalid PID'));
                    
                    nativeSyscalls.killProcess(pidNum);
                    resolve(`Process ${pidNum} terminated via native call`);
                    break;
                }

                case 'processList': {
                    const processes = nativeSyscalls.processList();
                    resolve(processes.length > 0 ? processes.join('\n') : 'No processes found');
                    break;
                }

                default:
                    reject(new Error('Unimplemented system call or not yet mapped to native module.'));
            }
        } catch (e) {
            reject(new Error(`Native error: ${e.message}`));
        }
    });
};

module.exports = { executeSystemCall, allowedOperations };
