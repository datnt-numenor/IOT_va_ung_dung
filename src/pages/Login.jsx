import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const navigate = useNavigate();
  const { login } = useAuth();

  function handleSubmit(event) {
    event.preventDefault();

    if (username === "admin" && password === "123456") {
      login({ remember });
      navigate("/dashboard", { replace: true });
    } else {
      alert("Invalid username or password");
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand-panel" aria-label="Giới thiệu IoT Room">
        <div className="login-brand">
          <strong>IoT ROOM</strong>
          <span>SMART MONITORING SYSTEM</span>
        </div>

        <div className="login-hero-copy">
          <h1>Giám sát phòng học thông minh và trực quan</h1>
          <p>
            Theo dõi nhiệt độ, độ ẩm, ánh sáng và điều khiển thiết bị qua
            ESP32 theo thời gian thực.
          </p>
        </div>

        <span className="login-decoration decoration-large" />
        <span className="login-decoration decoration-medium" />
        <span className="login-decoration decoration-small" />
      </section>

      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Đăng nhập</h1>
        <p>Sử dụng tài khoản hệ thống IoT Room</p>

        <div className="form-group">
          <label htmlFor="username">TÊN ĐĂNG NHẬP</label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Nhập tên đăng nhập"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">MẬT KHẨU</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
          />
        </div>

        <label className="remember-login">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>Ghi nhớ đăng nhập</span>
        </label>

        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}

export default Login;
