import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSync, FaFilter, FaSignOutAlt, FaBug, FaPlus, FaTimes } from 'react-icons/fa';
import Map from '../components/Map';
import DustbinList from '../components/DustbinList';
import { useAuth } from '../context/AuthContext';
import './WorkerDashboard.css';

export default function WorkerDashboard() {
  const [prioritizedDustbins, setPrioritizedDustbins] = useState([]);
  const [nearbyDustbins, setNearbyDustbins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newDustbin, setNewDustbin] = useState({ latitude: '', longitude: '', type: 'organic' });
  const [loading, setLoading] = useState({ prioritized: false, nearby: false, form: false });
  const [error, setError] = useState({ prioritized: '', nearby: '', form: '' });
  const [filterFull, setFilterFull] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err)
      );
    });
  };

  const fetchPrioritized = async () => {
    setLoading((prev) => ({ ...prev, prioritized: true }));
    setError((prev) => ({ ...prev, prioritized: '' }));
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/dustbins/prioritized`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrioritizedDustbins(res.data);
    } catch (err) {
      setError((prev) => ({ ...prev, prioritized: 'Failed to load prioritized dustbins.' }));
      console.error('Prioritized fetch error:', err);
    } finally {
      setLoading((prev) => ({ ...prev, prioritized: false }));
    }
  };

  const fetchNearby = async () => {
    setLoading((prev) => ({ ...prev, nearby: true }));
    setError((prev) => ({ ...prev, nearby: '' }));
    try {
      const { latitude, longitude } = await getLocation();
      const radius = 10;
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dustbins/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNearbyDustbins(res.data);
    } catch (err) {
      setError((prev) => ({ ...prev, nearby: 'Failed to load nearby dustbins.' }));
      console.error('Nearby fetch error:', err);
    } finally {
      setLoading((prev) => ({ ...prev, nearby: false }));
    }
  };

  const handleAddDustbin = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, form: true }));
    setError((prev) => ({ ...prev, form: '' }));
    try {
      const payload = {
        latitude: parseFloat(newDustbin.latitude),
        longitude: parseFloat(newDustbin.longitude),
        type: newDustbin.type,
      };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/dustbins/add`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowForm(false);
      setNewDustbin({ latitude: '', longitude: '', type: 'organic' });
      fetchPrioritized();
      fetchNearby();
    } catch (err) {
      setError((prev) => ({ ...prev, form: 'Failed to add dustbin.' }));
      console.error('Error adding dustbin:', err);
    } finally {
      setLoading((prev) => ({ ...prev, form: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (token) {
      fetchPrioritized();
      fetchNearby();
      const interval = setInterval(() => {
        fetchPrioritized();
        fetchNearby();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const filteredPrioritized = filterFull
    ? prioritizedDustbins.filter((d) => d.fillLevel >= 80)
    : prioritizedDustbins;
  const filteredNearby = filterFull
    ? nearbyDustbins.filter((d) => d.fillLevel >= 80)
    : nearbyDustbins;

  return (
    <div className="worker-dashboard">
      {/* Header */}
      <header className="header">
        <h1>Contributer Dashboard</h1>
        <div className="header-actions">
          <motion.button
            className="action-btn"
            onClick={() => { fetchPrioritized(); fetchNearby(); }}
            disabled={loading.prioritized || loading.nearby}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSync /> Refresh
          </motion.button>
          <motion.button
            className={`action-btn ${filterFull ? 'active' : ''}`}
            onClick={() => setFilterFull(!filterFull)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilter /> {filterFull ? 'Show All' : 'Full Dustbins'}
          </motion.button>
          <motion.button
            className="action-btn"
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
        className="welcome"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Welcome, Contributer!</h2>
        <p>Manage and monitor dustbins efficiently.</p>
      </motion.div>

      {/* Error Messages */}
      <AnimatePresence>
        {(error.prioritized || error.nearby || error.form) && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error.prioritized && (
              <p>
                {error.prioritized}
                <button className="retry-btn" onClick={fetchPrioritized}>Retry</button>
              </p>
            )}
            {error.nearby && (
              <p>
                {error.nearby}
                <button className="retry-btn" onClick={fetchNearby}>Retry</button>
              </p>
            )}
            {error.form && <p>{error.form}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {(loading.prioritized || loading.nearby) && (
        <div className="loading">
          <span className="spinner"></span>
          <p>Loading dustbins...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading.prioritized && !loading.nearby && (
        <>
          {/* Stats Section */}
          <motion.div
            className="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="stat-card">
              <h3>{prioritizedDustbins.length}</h3>
              <p>Prioritized Dustbins</p>
            </div>
            <div className="stat-card">
              <h3>{nearbyDustbins.length}</h3>
              <p>Nearby Dustbins</p>
            </div>
            <div className="stat-card">
              <h3>{prioritizedDustbins.filter((d) => d.fillLevel >= 80).length}</h3>
              <p>Full Dustbins</p>
            </div>
          </motion.div>

          {/* Add Dustbin Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                className="modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="modal-content">
                  <button className="close-btn" onClick={() => setShowForm(false)}>
                    <FaTimes />
                  </button>
                  <h2>Add New Dustbin</h2>
                  <form onSubmit={handleAddDustbin}>
                    <div className="input-group">
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={newDustbin.latitude}
                        onChange={(e) => setNewDustbin({ ...newDustbin, latitude: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={newDustbin.longitude}
                        onChange={(e) => setNewDustbin({ ...newDustbin, longitude: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <select
                        value={newDustbin.type}
                        onChange={(e) => setNewDustbin({ ...newDustbin, type: e.target.value })}
                      >
                        <option value="organic">Organic</option>
                        <option value="plastic">Plastic</option>
                        <option value="general">General</option>
                        <option value="metal">Metal</option>
                      </select>
                    </div>
                    <motion.button
                      type="submit"
                      className="submit-btn"
                      disabled={loading.form}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {loading.form ? <span className="spinner"></span> : 'Submit'}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Wrapper */}
          <div className="content-wrapper">
            <motion.div
              className="map-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Map dustbins={[...filteredPrioritized, ...filteredNearby]} />
            </motion.div>
            <div className="lists-container">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2>Filled Dustbins</h2>
                <DustbinList
                  dustbins={filteredPrioritized}
                  title="Filled Dustbins"
                  fetchData={fetchPrioritized}
                  role="worker"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2>Nearby Dustbins</h2>
                <DustbinList
                  dustbins={filteredNearby}
                  title="Nearby Dustbins"
                  fetchData={fetchNearby}
                  role="worker"
                />
              </motion.div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <motion.button
              className="action-btn"
              onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus /> Add Dustbin
            </motion.button>
            <motion.button
              className="action-btn"
              onClick={() => navigate('/report-issue')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBug /> Report Issue
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}