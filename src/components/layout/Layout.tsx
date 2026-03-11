import { Outlet } from 'react-router-dom';
import Navbar from '../ui/Navbar';
import './Layout.css';

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-main">
        <div className="layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
