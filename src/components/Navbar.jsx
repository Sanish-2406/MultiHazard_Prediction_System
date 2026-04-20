import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-brand">
        <span className="brand-icon"></span>
        MultiHazard AI
      </div>

      <div className="navbar-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          id="nav-dashboard"
        >
          ️ Dashboard
        </NavLink>
        <NavLink
          to="/training"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          id="nav-training"
        >
           Training
        </NavLink>
        <NavLink
          to="/results"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          id="nav-results"
        >
           Results
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          id="nav-history"
        >
           History
        </NavLink>
      </div>

      <div className="navbar-user">
        <span className="user-email">{user?.email}</span>
        <button className="btn-logout" onClick={handleLogout} id="btn-logout">
          ⏻ Logout
        </button>
      </div>
    </nav>
  );
}
