import React from "react";
import { FaMapMarkerAlt, FaCheck } from "react-icons/fa";
import "./DustbinList.css";

const DustbinList = ({
  dustbins,
  userLocation,
  setDestination,
  role,
  onMarkServiced,
}) => {
  return (
    <div className="dustbin-list">
      {dustbins.length > 0 ? (
        dustbins.map((dustbin) => (
          <div
            className="dustbin-card"
            key={dustbin.id}
            onClick={() => {
              if (!userLocation) {
                alert("Location access required to show route.");
              } else {
                setDestination({ lat: dustbin.latitude, lng: dustbin.longitude });
              }
            }}
          >
            <FaMapMarkerAlt className="dustbin-icon" />
            <div className="dustbin-info">
              <h3>Dustbin #{dustbin.id}</h3>
              <p>Lat: {dustbin.latitude}</p>
              <p>Lng: {dustbin.longitude}</p>
              <p>
                Fill:{" "}
                <span className={dustbin.fillLevel >= 80 ? "full" : ""}>
                  {dustbin.fillLevel}%
                </span>
              </p>
              <p>Type: {dustbin.type || "Unknown"}</p>
              {role === "worker" && (
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onMarkServiced(dustbin.id);
                  }}
                >
                  <FaCheck /> Mark as Serviced
                </button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No dustbins found.</p>
      )}
    </div>
  );
};

export default DustbinList;