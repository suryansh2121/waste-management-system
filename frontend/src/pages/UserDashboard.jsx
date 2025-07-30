import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSync, FaFilter, FaSignOutAlt, FaBug, FaPlus } from 'react-icons/fa';
import Map from '../components/Map';
import DustbinList from '../components/DustbinList';
import { useAuth } from '../context/AuthContext';
import styles from './UserDashboard.module.css';

export default function UserDashboard() {
  const [dustbins, setDustbins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterFull, setFilterFull] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const fetchAvailable = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/dustbins/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDustbins(res.data);
    } catch (error) {
      setError('Failed to load dustbins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
    const interval = setInterval(fetchAvailable, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredDustbins = filterFull
    ? dustbins.filter((dustbin) => dustbin.fillLevel >= 80)
    : dustbins;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <h1>User Dashboard</h1>
        <div className={styles.headerActions}>
          <motion.button
            className={styles.actionBtn}
            onClick={fetchAvailable}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSync /> Refresh
          </motion.button>
          <motion.button
            className={`${styles.actionBtn} ${filterFull ? styles.active : ''}`}
            onClick={() => setFilterFull(!filterFull)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilter /> {filterFull ? 'Show All' : 'Full Dustbins'}
          </motion.button>
          <motion.button
            className={styles.actionBtn}
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </header>

      {/* Welcome Message */}
      <motion.div
        className={styles.welcome}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Welcome, Citizen!</h2>
        <p>Monitor and manage nearby dustbins with ease.</p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            className={styles.error}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
            <button className={styles.retryBtn} onClick={fetchAvailable}>
              Retry
            </button>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className={styles.loading}>
          <span className={styles.spinner}></span>
          <p>Loading dustbins...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Stats Section */}
          <motion.div
            className={styles.stats}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.statCard}>
              <h3>{dustbins.length}</h3>
              <p>Total Dustbins</p>
            </div>
            <div className={styles.statCard}>
              <h3>{dustbins.filter((d) => d.fillLevel >= 80).length}</h3>
              <p>Full Dustbins</p>
            </div>
            <div className={styles.statCard}>
              <h3>{dustbins.filter((d) => d.fillLevel < 80).length}</h3>
              <p>Available Dustbins</p>
            </div>
          </motion.div>

          {/* Content Wrapper */}
          <div className={styles.contentWrapper}>
            <motion.div
              className={styles.mapContainer}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Map dustbins={filteredDustbins} />
            </motion.div>
            <motion.div
              className={styles.listContainer}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DustbinList
                dustbins={filteredDustbins}
                title="Available Dustbins"
                fetchData={fetchAvailable}
                role="user"
              />
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <motion.button
              className={styles.actionBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/report-issue')}
            >
              <FaBug /> Report Issue
            </motion.button>
            <motion.button
              className={styles.actionBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/request-dustbin')}
            >
              <FaPlus /> Request New Dustbin
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}