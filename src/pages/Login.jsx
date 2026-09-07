import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    if (username === "admin" && password === "123456") {
      navigate("/dashboard");
    } else {
      alert("Invalid username or password");
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>IoT Smart Room</h1>
        <p>Sign in to continue</p>

        <div className="form-group">
          <label>Username</label>

          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username"
          />
        </div>

        <div className="form-group">
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
