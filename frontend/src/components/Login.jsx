import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import { FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'; // Icons
import './Login.css';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);

  const roleFromHome = location.state?.role || 'citizen';
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    role: roleFromHome,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setCredentials((prev) => ({ ...prev, role: roleFromHome }));
  }, [roleFromHome]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        credentials
      );
      const token = res.data.token;
      setToken(token);
      localStorage.setItem('token', token);

      if (credentials.role === 'citizen') {
        navigate('/user');
      } else if (credentials.role === 'worker') {
        navigate('/contributer');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login failed', error);
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
        <h2>Login as {credentials.role === 'worker' ? 'Contributer' : 'Citizen'}</h2>
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
              type={showPassword ? 'text' : 'password'}
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
          <div className="input-group">
            <select
              value={credentials.role}
              onChange={(e) =>
                setCredentials({ ...credentials, role: e.target.value })
              }
            >
              <option value="citizen">Citizen</option>
              <option value="worker">Contributer</option>
            </select>
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
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              'Login'
            )}
          </motion.button>
          <a href="/forgot-password" className="forgot-password">
            Forgot Password?
          </a>
        </form>
      </motion.div>
    </div>
  );
}