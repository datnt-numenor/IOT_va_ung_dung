import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  History,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";

const fullName = "Nguyễn Tiến Đạt";

function Sidebar() {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    function handlePointerDown(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleLogout() {
    setIsAccountMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

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

      <div className="sidebar-account-menu" ref={accountMenuRef}>
        {isAccountMenuOpen && (
          <div className="account-dropdown" role="menu">
            <button type="button" role="menuitem" onClick={handleLogout}>
              <LogOut size={17} />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="sidebar-account"
          aria-label={`Mở menu tài khoản của ${fullName}`}
          aria-haspopup="menu"
          aria-expanded={isAccountMenuOpen}
          onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
        >
          <span className="account-avatar">Đ</span>

          <span className="account-info">
            <strong title={fullName}>{fullName}</strong>
            <span>B23DCCN139</span>
          </span>

          <ChevronDown
            className={isAccountMenuOpen ? "account-chevron open" : "account-chevron"}
            size={14}
          />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
