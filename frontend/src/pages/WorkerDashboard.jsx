import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AddDustbinsModel from "../components/AddDustbins";
import {
  FaSync,
  FaFilter,
  FaSignOutAlt,
  FaBug,
  FaPlus,
  FaTimes,
  FaMap,
} from "react-icons/fa";
import Map from "../components/Map";
import DustbinList from "../components/DustbinList";
import { useAuth } from "../context/AuthContext";
import "./WorkerDashboard.css";
import AddDustbins from "../components/AddDustbins";

export default function WorkerDashboard() {
  const [prioritizedDustbins, setPrioritizedDustbins] = useState([]);
  const [nearbyDustbins, setNearbyDustbins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newDustbin, setNewDustbin] = useState({
    latitude: "",
    longitude: "",
    type: "recyclable",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({
    prioritized: false,
    nearby: false,
    form: false,
    search: false,
  });
  const [error, setError] = useState({
    prioritized: "",
    nearby: "",
    form: "",
    search: "",
  });
  const [filterFull, setFilterFull] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err)
      );
    });
  };

  const fetchPrioritized = async () => {
    setLoading((prev) => ({ ...prev, prioritized: true }));
    setError((prev) => ({ ...prev, prioritized: "" }));
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dustbins/prioritized`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data.map((d) => ({
        ...d,
        fillLevel: Number(d.fill_level) || 0,
      }));
      setPrioritizedDustbins(data);
    } catch (err) {
      setError((prev) => ({
        ...prev,
        prioritized: "Failed to load prioritized dustbins.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, prioritized: false }));
    }
  };

  const fetchNearby = async () => {
    setLoading((prev) => ({ ...prev, nearby: true }));
    setError((prev) => ({ ...prev, nearby: "" }));
    try {
      const location = await getLocation();
      setUserLocation(location);
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/dustbins/nearby`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { latitude: location.lat, longitude: location.lng, radius: 10 },
        }
      );
      const data = res.data.map((d) => ({
        ...d,
        fillLevel: Number(d.fill_level) || 0,
      }));
      setNearbyDustbins(data);
      localStorage.setItem("lastWorkerSearch", JSON.stringify({ location, timestamp: Date.now() }));
    } catch (err) {
      setError((prev) => ({
        ...prev,
        nearby: "Failed to load nearby dustbins.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, nearby: false }));
    }
  };


  const searchLocation = async () => {
    if (!searchQuery) return;
    setLoading((prev) => ({ ...prev, search: true }));
    setError((prev) => ({ ...prev, search: "" }));
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: { q: searchQuery, format: "json", limit: 5 },
        }
      );
      setSearchResults(res.data);
    } catch (err) {
      setError((prev) => ({ ...prev, search: "Failed to search location." }));
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  const handleAddDustbin = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, form: true }));
    setError((prev) => ({ ...prev, form: "" }));
    try {
      const payload = {
        latitude: parseFloat(newDustbin.latitude),
        longitude: parseFloat(newDustbin.longitude),
        type: newDustbin.type,
      };
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/dustbins/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowForm(false);
      setNewDustbin({ latitude: "", longitude: "", type: "recyclable" });
      setSearchQuery("");
      setSearchResults([]);
      fetchPrioritized();
      fetchNearby();
    } catch (err) {
      setError((prev) => ({ ...prev, form: "Failed to add dustbin." }));
    } finally {
      setLoading((prev) => ({ ...prev, form: false }));
    }
  };

  const handleMarkServiced = async (dustbinId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/dustbins/${dustbinId}/service`,
        { fillLevel: 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPrioritized();
      fetchNearby();
    } catch (err) {
      setError((prev) => ({
        ...prev,
        form: "Failed to mark dustbin as serviced.",
      }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (token) {
      const lastSearch = JSON.parse(localStorage.getItem("lastWorkerSearch"));
      if (lastSearch) {
        setUserLocation(lastSearch.location);
        fetchNearby();
      } else {
        fetchPrioritized();
        fetchNearby();
      }
      const interval = setInterval(() => {
        fetchPrioritized();
        fetchNearby();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const filteredPrioritized = prioritizedDustbins.filter((dustbin) => {
    if (filterFull && dustbin.fillLevel < 80) return false;
    if (filterType === "recyclable") return dustbin.type === "recyclable";
    if (filterType === "non-recyclable")
      return dustbin.type === "non-recyclable";
    return true;
  });

  const filteredNearby = nearbyDustbins.filter((dustbin) => {
    if (filterFull && dustbin.fillLevel < 80) return false;
    if (filterType === "recyclable") return dustbin.type === "recyclable";
    if (filterType === "non-recyclable")
      return dustbin.type === "non-recyclable";
    return true;
  });

  return (
    <div className="worker-dashboard">
      <header className="header">
        <h1>Contributer Dashboard</h1>
        <div className="header-actions">
          <motion.button
            className="action-btn"
            onClick={fetchNearby}
            disabled={loading.nearby}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaMap /> Search Nearby Dustbins
          </motion.button>
          <motion.button
            className="action-btn"
            onClick={() => {
              fetchPrioritized();
              fetchNearby();
            }}
            disabled={loading.prioritized || loading.nearby}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSync /> Refresh
          </motion.button>
          <motion.button
            className={`action-btn ${filterFull ? "active" : ""}`}
            onClick={() => setFilterFull(!filterFull)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilter /> {filterFull ? "Show All" : "Full Dustbins"}
          </motion.button>
          <motion.button
            className={`action-btn ${filterType !== "all" ? "active" : ""}`}
            onClick={() =>
              setFilterType(
                filterType === "all"
                  ? "recyclable"
                  : filterType === "recyclable"
                  ? "non-recyclable"
                  : "all"
              )
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaFilter />{" "}
            {filterType === "all"
              ? "Filter by Type"
              : filterType === "recyclable"
              ? "Recyclable"
              : "Non-Recyclable"}
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

      <motion.div
        className="welcome"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Welcome, Contributer!</h2>
        <p>Manage and monitor dustbins efficiently.</p>
      </motion.div>

      <AnimatePresence>
        {(error.prioritized || error.nearby || error.form || error.search) && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error.prioritized && (
              <p>
                {error.prioritized}
                <button className="retry-btn" onClick={fetchPrioritized}>
                  Retry
                </button>
              </p>
            )}
            {error.nearby && (
              <p>
                {error.nearby}
                <button className="retry-btn" onClick={fetchNearby}>
                  Retry
                </button>
              </p>
            )}
            {error.form && (
              <p>
                {error.form}
                <button className="retry-btn" onClick={handleAddDustbin}>
                  Retry
                </button>
              </p>
            )}
            {error.search && <p>{error.search}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {(loading.prioritized || loading.nearby) && (
        <div className="loading">
          <span className="spinner"></span>
          <p>Loading dustbins...</p>
        </div>
      )}

      {!loading.prioritized && !loading.nearby && (
        <>
          <motion.div
            className="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="stat-card">
              <h3>{filteredPrioritized.length}</h3>
              <p>Prioritized Dustbins</p>
            </div>
            <div className="stat-card">
              <h3>{filteredNearby.length}</h3>
              <p>Nearby Dustbins</p>
            </div>
            <div className="stat-card">
              <h3>
                {
                  [...filteredPrioritized, ...filteredNearby].filter(
                    (d) => d.fillLevel >= 80
                  ).length
                }
              </h3>
              <p>Full Dustbins</p>
            </div>
          </motion.div>

      <AnimatePresence>
  {showForm && (
    <AddDustbinsModel
      showForm={showForm}
      setShowForm={setShowForm}
      newDustbin={newDustbin}
      setNewDustbin={setNewDustbin}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchResults={searchResults}
      setSearchResults={setSearchResults}
      searchLocation={searchLocation}
      handleAddDustbin={handleAddDustbin}
      loading={loading}
    />
  )}
</AnimatePresence>


          <div className="content-wrapper">
            <motion.div
              className="map-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Map
                dustbins={[...filteredPrioritized, ...filteredNearby]}
                userLocation={userLocation}
                destination={destination}
                setDestination={setDestination}
              />
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
                  userLocation={userLocation}
                  setUserLocation={setUserLocation}
                  setDestination={setDestination}
                  onMarkServiced={handleMarkServiced}
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
                  userLocation={userLocation}
                  setUserLocation={setUserLocation}
                  setDestination={setDestination}
                  onMarkServiced={handleMarkServiced}
                />
              </motion.div>
            </div>
          </div>

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
              onClick={() => setDestination(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear Route
            </motion.button>
            <motion.button
              className="action-btn"
              onClick={() => navigate("/report-issue")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBug /> Report Issue
            </motion.button>
            <motion.button
              className="action-btn"
              onClick={() => navigate("/view-issues")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBug /> View Issues
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
