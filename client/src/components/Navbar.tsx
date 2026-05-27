import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useDarkMode from '../hooks/useDarkMode';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    // nav bar: flex row, space-between, padding, background, bottom border
    <nav>
      <Link to="/projects">Swatter</Link>
      {/* right side: flex row, gap, align center */}
      <div>
        <span>{user.email}</span>
        <button onClick={toggle}>{isDark ? 'Light' : 'Dark'}</button>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}

export default Navbar;
