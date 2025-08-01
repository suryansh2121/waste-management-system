import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSync, FaFilter, FaSignOutAlt, FaBug, FaPlus, FaMap } from 'react-icons/fa';
import Map from '../components/Map';
import DustbinList from '../components/DustbinList';
import { useAuth } from '../context/AuthContext';
import styles from './UserDashboard.module.css';

export default function UserDashboard() {
  const [dustbins, setDustbins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterFull, setFilterFull] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'recyclable', 'non-recyclable'
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const fetchAvailable = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dustbins/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDustbins(res.data);
    } catch (error) {
      setError('Failed to load dustbins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyDustbins = async () => {
    if (!userLocation) {
      setError('Please enable location access to search for nearby dustbins.');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(location);
          performNearbySearch(location);
        },
        () => setError('Location access denied. Please enable location services.')
      );
      return;
    }
    performNearbySearch(userLocation);
  };

  const performNearbySearch = async (location) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dustbins/nearby`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { latitude: location.lat, longitude: location.lng, radius: 10 },
      });
      setDustbins(res.data);
      localStorage.setItem('lastSearch', JSON.stringify({ location, timestamp: Date.now() }));
    } catch (error) {
      setError('Failed to find nearby dustbins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lastSearch = JSON.parse(localStorage.getItem('lastSearch'));
    if (lastSearch) {
      setUserLocation(lastSearch.location);
      performNearbySearch(lastSearch.location);
    } else {
      fetchAvailable();
    }
    const interval = setInterval(fetchAvailable, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setError('Please enable location access to use this feature.')
      );
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredDustbins = dustbins.filter((dustbin) => {
    if (filterFull && dustbin.fillLevel < 80) return false;
    if (filterType === 'recyclable') return dustbin.type === 'recyclable';
    if (filterType === 'non-recyclable') return dustbin.type === 'non-recyclable';
    return true;
  });

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>User Dashboard</h1>
        <div className={styles.headerActions}>
          <motion.button className={styles.actionBtn} onClick={searchNearbyDustbins}>
            <FaMap /> Search Nearby Dustbins
          </motion.button>
          <motion.button className={styles.actionBtn} onClick={fetchAvailable}>
            <FaSync /> Refresh
          </motion.button>
          <motion.button
            className={`${styles.actionBtn} ${filterFull ? styles.active : ''}`}
            onClick={() => setFilterFull(!filterFull)}
          >
            <FaFilter /> {filterFull ? 'Show All' : 'Full Dustbins'}
          </motion.button>
          <motion.button
            className={`${styles.actionBtn} ${filterType !== 'all' ? styles.active : ''}`}
            onClick={() =>
              setFilterType(
                filterType === 'all' ? 'recyclable' : filterType === 'recyclable' ? 'non-recyclable' : 'all'
              )
            }
          >
            <FaFilter /> {filterType === 'all' ? 'Filter by Type' : filterType === 'recyclable' ? 'Recyclable' : 'Non-Recyclable'}
          </motion.button>
          <motion.button className={styles.actionBtn} onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </header>

      <motion.div className={styles.welcome}>
        <h2>Welcome, Citizen!</h2>
        <p>Monitor and manage nearby dustbins with ease.</p>
      </motion.div>

      {error && (
        <motion.p className={styles.error}>
          {error}
          <button className={styles.retryBtn} onClick={searchNearbyDustbins}>Retry</button>
        </motion.p>
      )}

      {loading ? (
        <div className={styles.loading}>
          <span className={styles.spinner}></span>
          <p>Loading dustbins...</p>
        </div>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}><h3>{filteredDustbins.length}</h3><p>Total Nearby Dustbins</p></div>
            <div className={styles.statCard}><h3>{filteredDustbins.filter(d => d.fillLevel >= 80).length}</h3><p>Full Dustbins</p></div>
            <div className={styles.statCard}><h3>{filteredDustbins.filter(d => d.fillLevel < 80).length}</h3><p>Available Dustbins</p></div>
          </div>

          <div className={styles.contentWrapper}>
            <Map
              dustbins={filteredDustbins}
              userLocation={userLocation}
              destination={destination}
              setDestination={setDestination}
            />
            <DustbinList
              dustbins={filteredDustbins}
              userLocation={userLocation}
              setUserLocation={setUserLocation}
              setDestination={setDestination}
            />
          </div>

          <div className={styles.actionButtons}>
            <motion.button onClick={() => setDestination(null)} className={styles.actionBtn}>
              Clear Route
            </motion.button>
            <motion.button onClick={() => navigate('/report-issue')} className={styles.actionBtn}>
              <FaBug /> Report Issue
            </motion.button>
            <motion.button onClick={() => navigate('/request-dustbin')} className={styles.actionBtn}>
              <FaPlus /> Request New Dustbin
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}