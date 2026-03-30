import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Server, Crosshair, LogOut } from 'lucide-react';

const Sidebar = ({ isAdmin }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="sidebar border-r">
      <div className="flex flex-col items-center mb-10 mt-4">
        <Server size={42} color="var(--primary-color)" className="animate-flicker" style={{ filter: 'drop-shadow(0 0 8px var(--primary-color))', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', color: '#fff', letterSpacing: '2px', textAlign: 'center' }}>SYS_GUARD<br/><span style={{ fontSize:'0.75rem', color:'var(--primary-color)' }}>v2.0.0</span></h2>
      </div>

      <div style={{ flex: 1 }}>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Server size={18} />
          <span>TERMINAL</span>
        </NavLink>
        
        {isAdmin && (
          <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Crosshair size={18} />
            <span style={isAdmin ? { color: 'var(--secondary-color)' } : {}}>AUDIT_LOGS</span>
          </NavLink>
        )}
      </div>

      <button onClick={handleLogout} className="nav-item" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}>
        <LogOut size={18} color="var(--danger-color)" />
        <span style={{ color: 'var(--danger-color)' }}>[ DISCONNECT ]</span>
      </button>
    </div>
  );
};

export default Sidebar;
