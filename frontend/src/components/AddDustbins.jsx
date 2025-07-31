import React from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function AddDustbinsModel({
  showForm,
  setShowForm,
  newDustbin,
  setNewDustbin,
  searchQuery,
  setSearchQuery,
  searchResults,
  searchLocation,
  setSearchResults,
  handleAddDustbin,
  loading,
}) {
  if (!showForm) return null;

  return (
    <motion.div
      className="modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="modal-content">
        <button
          className="close-btn"
          onClick={() => {
            setShowForm(false);
            setSearchQuery("");
            setSearchResults([]);
          }}
        >
          <FaTimes />
        </button>
        <h2>Add New Dustbin</h2>
        <form onSubmit={handleAddDustbin}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Search location (e.g., city, address)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <motion.button
              type="button"
              className="action-btn"
              onClick={searchLocation}
              disabled={loading.search}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading.search ? (
                <span className="spinner"></span>
              ) : (
                "Search"
              )}
            </motion.button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.place_id}
                  className="search-result"
                  onClick={() =>
                    setNewDustbin({
                      ...newDustbin,
                      latitude: result.lat,
                      longitude: result.lon,
                    })
                  }
                >
                  {result.display_name}
                </div>
              ))}
            </div>
          )}

          <div className="input-group">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={newDustbin.latitude}
              onChange={(e) =>
                setNewDustbin({ ...newDustbin, latitude: e.target.value })
              }
              required
            />
          </div>
          <div className="input-group">
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={newDustbin.longitude}
              onChange={(e) =>
                setNewDustbin({ ...newDustbin, longitude: e.target.value })
              }
              required
            />
          </div>
          <div className="input-group">
            <select
              value={newDustbin.type}
              onChange={(e) =>
                setNewDustbin({ ...newDustbin, type: e.target.value })
              }
            >
              <option value="recyclable">Recyclable</option>
              <option value="non-recyclable">Non-Recyclable</option>
            </select>
          </div>
          <motion.button
            type="submit"
            className="submit-btn"
            disabled={loading.form}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading.form ? <span className="spinner"></span> : "Submit"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
