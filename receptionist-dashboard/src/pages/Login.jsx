import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔹 Try receptionist login first
      let res = await api.post("/receptionist/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("name", res.data.receptionist.name);
      localStorage.setItem("userType", "RECEPTIONIST");

      nav("/dashboard"); // ✅ receptionist dashboard
    } catch (receptionistError) {
      // 🔹 If receptionist login fails, try doctor login
      try {
        let res = await api.post("/doctor/login", { email, password });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("name", res.data.doctor.fullName);
        localStorage.setItem("userType", "DOCTOR");

        nav("/doctor-dashboard"); // ✅ doctor dashboard
      } catch (doctorError) {
        alert(
          doctorError.response?.data?.error ||
            "Invalid email or password for both roles"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
