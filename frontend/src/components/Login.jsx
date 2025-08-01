import { useState, useContext } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const roleFromHome = location.state?.role || "citizen";
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        credentials
      );
      const { token, user } = res.data;
      login(token, user.role);
      if (user.role === "citizen" && roleFromHome === "citizen") {
        navigate("/user");
      } else if (user.role === "worker" && roleFromHome === "worker") {
        navigate("/contributer");
      } else {
        setError(
          `You are not authorized to log in as a ${roleFromHome}. Your role is ${user.role}.`
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.error || "Login failed. Please try again."
      );
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-form"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <a href="/" className="back-link">
          <FaArrowLeft /> Back to Home
        </a>
        <h2>
          Login as {roleFromHome === "worker" ? "Contributer" : "citizen"}
        </h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              required
            />
          </div>
          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <motion.button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? <span className="spinner"></span> : "Login"}
          </motion.button>
          <a href="/forgot-password" className="forgot-password">
            Forgot Password?
          </a>
        </form>
        <a href="/register" className="register-link">
          New User? Create Account
        </a>
      </motion.div>
    </div>
  );
}
