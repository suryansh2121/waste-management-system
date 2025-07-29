import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaSync, FaFilter, FaMapMarkerAlt } from 'react-icons/fa';
import L from 'leaflet';
import './DustbinList.css';

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const DustbinList = () => {
  const [dustbins, setDustbins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterFull, setFilterFull] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  const fetchNearby = async (lat, lng) => {
    try {
      setError('');
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/dustbins/nearby`, {
        params: { latitude: lat, longitude: lng, radius: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setDustbins(res.data);
      setUserLocation([lat, lng]);
    } catch (error) {
      console.error('Nearby fetch failed:', error);
      setError('Failed to fetch nearby dustbins. Showing available dustbins instead.');
      fetchAvailable();
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailable = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/dustbins/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDustbins(res.data);
    } catch (error) {
      setError('Failed to fetch dustbins. Please try again later.');
      console.error('Available fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchNearby(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Geolocation not available. Showing all dustbins.');
          fetchAvailable();
        }
      );
    } else {
      console.warn('Geolocation not supported.');
      setError('Geolocation not supported. Showing all dustbins.');
      fetchAvailable();
    }

    const interval = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude } = pos.coords;
          fetchNearby(latitude, longitude);
        });
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const handleRefresh = () => {
    if (userLocation) {
      fetchNearby(userLocation[0], userLocation[1]);
    } else {
      fetchAvailable();
    }
  };

  const filteredDustbins = filterFull
    ? dustbins.filter((dustbin) => dustbin.fillLevel >= 80)
    : dustbins;

  return (
    <div className="dustbin-list-container">
      <header className="dustbin-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <h1>Nearby Dustbins</h1>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
          >
            <FaSync /> Refresh
          </button>
          <button
            className={`filter-btn ${filterFull ? 'active' : ''}`}
            onClick={() => setFilterFull(!filterFull)}
          >
            <FaFilter /> {filterFull ? 'Show All' : 'Full Dustbins'}
          </button>
        </div>
      </header>

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

      {loading ? (
        <div className="loading">
          <span className="spinner"></span>
          <p>Loading dustbins...</p>
        </div>
      ) : (
        <>
          {dustbins.length > 0 && userLocation ? (
            <motion.div
              className="map-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: '400px', width: '100%', borderRadius: '15px' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {filteredDustbins.map((dustbin) => (
                  <Marker
                    key={dustbin.id}
                    position={[dustbin.latitude, dustbin.longitude]}
                    icon={customIcon}
                  >
                    <Popup>
                      <b>Dustbin ID: {dustbin.id}</b>
                      <br />
                      Fill Level: {dustbin.fillLevel}%
                      <br />
                      Location: {dustbin.latitude}, {dustbin.longitude}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </motion.div>
          ) : null}

          <div className="dustbin-list">
            {filteredDustbins.length > 0 ? (
              filteredDustbins.map((dustbin, index) => (
                <motion.div
                  key={dustbin.id}
                  className="dustbin-card"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <FaMapMarkerAlt className="dustbin-icon" />
                  <div className="dustbin-info">
                    <h3>Dustbin #{dustbin.id}</h3>
                    <p>Location: {dustbin.latitude}, {dustbin.longitude}</p>
                    <p>Fill Level: <span className={dustbin.fillLevel >= 80 ? 'full' : ''}>{dustbin.fillLevel}%</span></p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="no-dustbins">No dustbins found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DustbinList;