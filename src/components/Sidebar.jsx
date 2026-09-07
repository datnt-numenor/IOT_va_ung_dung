import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  History,
  User,
  ChevronDown,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <h2>IoT ROOM</h2>
          <span>SMART MONITORING</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/data-sensor"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Database size={20} />
            <span>Data Sensor</span>
          </NavLink>

          <NavLink
            to="/action-history"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <History size={20} />
            <span>Action History</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-account">
        <div className="account-avatar">Đ</div>

        <div className="account-info">
          <strong>Nguyễn Tiến Đạt</strong>
          <span>B23DCCN139</span>
        </div>

        <ChevronDown size={14} />
      </div>
    </aside>
  );
}

export default Sidebar;
