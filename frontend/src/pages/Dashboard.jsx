import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const Dashboard = () => {
  const [operation, setOperation] = useState('listDir');
  const [parameters, setParameters] = useState('{}');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  const getHint = (op) => {
    const hints = {
      readFile: '{"filePath": "altafff/zubi.txt"}',
      writeFile: '{"filePath": "altafff/logs.txt", "content": "SYSTEM_CHECK_PASSED"}',
      listDir: '{"dirPath": "altafff"}',
      createFile: '{"filePath": "altafff/new_report.txt", "content": "Initializing..."}',
      deleteFile: '{"filePath": "altafff/temp.txt"}',
      createDir: '{"dirPath": "altafff/backup"}',
      deleteDir: '{"dirPath": "altafff/backup"}',
      renameFile: '{"oldPath": "altafff/old.txt", "newPath": "altafff/new.txt"}',
      processList: '{}',
      createProcess: '{"command": "notepad.exe"}',
      killProcess: '{"pid": 1234}'
    };
    return hints[op] || '{}';
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    setError('');
    setResult('');
    setLoading(true);

    setTimeout(async () => {
        try {
            let parsedParams = {};
            try { 
                parsedParams = JSON.parse(parameters); 
            } catch (err) { 
                if (parameters.includes('\\') && !parameters.includes('\\\\')) {
                    throw new Error('MALFORMED JSON: Unescaped backslashes detected. Use \\\\ for paths.');
                }
                throw new Error('MALFORMED JSON SEQUENCE'); 
            }

            const response = await api.post('/syscall/execute', { operation, parameters: parsedParams });
            setResult(response.data.result);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'SYSTEM_CALL_FAILED';
            const details = err.response?.data?.error ? ` (REASON: ${err.response.data.error})` : '';
            setError(`${msg}${details}`);
        } finally {
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="app-container">
      <Sidebar isAdmin={user?.role === 'Admin'} />
      <div className="main-content">
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', letterSpacing: '4px' }}>EXEC_TERMINAL</h1>
        
        <div className="glass-panel mb-8 animate-slide-in">
          <form onSubmit={handleExecute}>
            <div className="form-group flex justify-between" style={{ gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">SYSCALL_ROUTINE</label>
                <select 
                  className="form-control"
                  style={{ textTransform: 'uppercase', appearance: 'none', background: '#000' }}
                  value={operation}
                  onChange={(e) => {
                      setOperation(e.target.value);
                      setParameters(getHint(e.target.value));
                  }}
                >
                  <option value="readFile">readFile</option>
                  <option value="writeFile">writeFile</option>
                  <option value="listDir">listDir</option>
                  <option value="createFile">createFile</option>
                  <option value="deleteFile">deleteFile</option>
                  <option value="createDir">createDir</option>
                  <option value="deleteDir">deleteDir</option>
                  <option value="renameFile">renameFile</option>
                  <option value="processList">processList</option>
                  <option value="createProcess">createProcess</option>
                  <option value="killProcess">killProcess</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label flex justify-between">
                PAYLOAD (JSON_STRICT)
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TEMPLATE_LOADED</span>
              </label>
              <textarea 
                className="form-control"
                rows="4"
                value={parameters}
                onChange={(e) => setParameters(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? '[ EXECUTING... ]' : '[ DISPATCH_COMMAND ]'}
            </button>
          </form>
        </div>

        {loading && (
            <div className="terminal-output cursor-blink" style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
                [ SYSTEM ] Establishing secure tunnel...<br/>
                [ SYSTEM ] Bypassing node abstractions...<br/>
                [ SYSTEM ] Awaiting kernel response...
            </div>
        )}

        {!loading && error && (
          <div className="terminal-output cursor-blink" style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
            [ ERROR_CAUGHT ] {error}
          </div>
        )}

        {!loading && result && (
          <div className="terminal-output cursor-blink">
            {typeof result === 'object' && result?.type === 'binary/pdf' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--success-color)' }}>[ SUCCESS ] KERNEL_STREAM: {result.filename} ({Math.round(result.size / 1024)} KB)</span>
                    <button 
                        className="btn btn-primary"
                        style={{ width: 'auto', padding: '0.5rem 1rem', background: 'var(--success-color)', border: 'none', color: '#000', fontWeight: 'bold' }}
                        onClick={() => {
                            const byteCharacters = atob(result.content);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            const file = new Blob([byteArray], { type: 'application/pdf' });
                            const fileURL = URL.createObjectURL(file);
                            window.open(fileURL);
                        }}
                    >
                        INITIALIZE_PDF_VIEWER
                    </button>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Secure binary buffer decrypted successfully.</span>
                </div>
            ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{String(result)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
