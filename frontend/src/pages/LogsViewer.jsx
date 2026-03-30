import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Activity } from 'lucide-react';

const LogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/logs');
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch logs', err);
      setError(err.response?.data?.message || 'Failed to load logs. Check your connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar isAdmin={user?.role === 'Admin'} />
      <div className="main-content">
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--secondary-color)', letterSpacing: '4px' }}>THREAT_MATRIX</h1>
          <div className="flex items-center" style={{ background: 'rgba(255, 0, 60, 0.1)', padding: '0.5rem 1rem', border: '1px solid var(--secondary-color)' }}>
             <Activity size={16} color="var(--secondary-color)" style={{ marginRight: '0.5rem' }} className="animate-flicker" />
             <span style={{ fontSize: '0.875rem', color: 'var(--secondary-color)', textTransform: 'uppercase' }}>Auditing Live</span>
          </div>
        </div>
        
        <div className="glass-panel animate-slide-in" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
          {selectedLog && (
            <div style={{ 
              position: 'absolute', 
              top: 0, right: 0, bottom: 0, left: 0, 
              background: 'rgba(0,0,0,0.95)', 
              zIndex: 10, 
              padding: '2rem', 
              overflowY: 'auto',
              border: '2px solid var(--primary-color)',
              animation: 'fadeIn 0.2s ease-in'
            }}>
              <div className="flex justify-between items-center mb-6">
                <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>SYS_LOG_ENTRY: {selectedLog._id}</h3>
                <button 
                  onClick={() => setSelectedLog(null)}
                  style={{ background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '0.2rem 1rem', cursor: 'pointer' }}
                >
                  [ CLOSE ]
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>TIMESTAMP:</div>
                <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>ACTOR:</div>
                <div style={{ color: 'var(--primary-color)' }}>@{selectedLog.username}</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>OPERATION:</div>
                <div style={{ color: 'var(--secondary-color)' }}>{selectedLog.syscallName}</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>STATUS:</div>
                <div style={{ color: selectedLog.status === 'success' ? 'var(--success-color)' : 'var(--danger-color)' }}>{selectedLog.status.toUpperCase()}</div>
                
                <div style={{ color: 'var(--text-secondary)' }}>PARAMETERS:</div>
                <pre style={{ background: '#111', padding: '1rem', border: '1px solid #333', overflowX: 'auto' }}>
                  {JSON.stringify(selectedLog.parameters, null, 2)}
                </pre>
                
                <div style={{ color: 'var(--text-secondary)' }}>ERROR_TRACE:</div>
                <div style={{ color: 'var(--danger-color)', whiteSpace: 'pre-wrap' }}>{selectedLog.errorMessage || 'NONE (CLEAN_EXECUTION)'}</div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem 2rem', color: 'var(--danger-color)', background: 'rgba(255,0,60,0.1)', border: '1px solid var(--danger-color)', margin: '1rem' }}>
              ⚠ ACCESS_ERROR: {error}
            </div>
          )}

          {loading ? (
            <div className="cursor-blink" style={{ padding: '2rem', color: 'var(--primary-color)' }}>[ DOWNLOADING_DATA_STREAM... ]</div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
              <table className="data-table">
                <thead style={{ background: 'rgba(0, 243, 255, 0.05)' }}>
                  <tr>
                    <th>TIME_STAMP</th>
                    <th>ACTOR</th>
                    <th>OPERATION</th>
                    <th>PARAMETERS</th>
                    <th>STATUS</th>
                    <th>TRACE</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr 
                      key={log._id} 
                      onClick={() => setSelectedLog(log)}
                      style={{ 
                        animation: `slideIn 0.3s ease-out forwards`, 
                        animationDelay: `${index * 50}ms`, 
                        opacity: 0,
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      className="hover-row"
                    >
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                      <td style={{ color: 'var(--primary-color)' }}>@{log.username}</td>
                      <td><span style={{ border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.5)' }}>{log.syscallName}</span></td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {JSON.stringify(log.parameters)}
                      </td>
                      <td>
                        <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                          [{log.status}]
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--danger-color)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.errorMessage || 'CLEAN'}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="6" className="cursor-blink" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>[ NO_DATA_AVAILABLE ]</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsViewer;
