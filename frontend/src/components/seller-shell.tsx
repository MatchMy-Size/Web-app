import { useState } from 'react';
import { FiBarChart2, FiGrid, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import { useAuth } from '@/context/auth-context';
import { signOutUser } from '@/lib/auth-api';
import '@/seller-portal.css';

const navItems = [
  { to: '/seller/dashboard', label: 'Overview', icon: FiBarChart2 },
  { to: '/seller/categories', label: 'Size charts', icon: FiGrid },
];

export function SellerShell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    await signOutUser();
    navigate('/seller/login', { replace: true });
  };

  return (
    <div className="seller-app">
      <aside className={`seller-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="seller-sidebar-head">
          <NavLink to="/seller/dashboard" className="seller-brand" onClick={() => setMenuOpen(false)}>
            <span className="seller-brand-mark"><AppLogo size={38} decorative /></span>
            <span><strong>MatchMySize</strong><small>Seller Studio</small></span>
          </NavLink>
          <button className="seller-mobile-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><FiX /></button>
        </div>

        <div className="seller-nav-label">Workspace</div>
        <nav className="seller-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `seller-nav-item${isActive ? ' active' : ''}`}
            >
              <item.icon /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="seller-sidebar-user">
          <span className="seller-avatar">{(user?.displayName || user?.email || 'S').charAt(0).toUpperCase()}</span>
          <span><strong>{user?.displayName || 'Seller'}</strong><small>{user?.email || 'Seller account'}</small></span>
          <button type="button" onClick={logout} title="Sign out" aria-label="Sign out"><FiLogOut /></button>
        </div>
      </aside>

      {menuOpen && <button className="seller-sidebar-backdrop" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <div className="seller-workspace">
        <header className="seller-mobile-header">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><FiMenu /></button>
          <div className="seller-brand"><span className="seller-brand-mark"><AppLogo size={32} decorative /></span><span><strong>MatchMySize</strong><small>Seller Studio</small></span></div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
