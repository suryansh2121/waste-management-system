import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { useEffect } from "react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function Routing({ from, to }) {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      routeWhileDragging: false,
      show: false,
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [from, to, map]);

  return null;
}

export default function Map({ dustbins, userLocation, destination, setDestination }) {
  const center = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];

  const sortedDustbins = dustbins.sort((a, b) => {
    if (!userLocation) return 0;
    const distA = Math.hypot(
      a.latitude - userLocation.lat,
      a.longitude - userLocation.lng
    );
    const distB = Math.hypot(
      b.latitude - userLocation.lat,
      b.longitude - userLocation.lng
    );
    return distA - distB;
  });

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {sortedDustbins.map((bin) => (
          <Marker
            key={bin.id}
            position={[bin.latitude, bin.longitude]}
            eventHandlers={{
              click: () => {
                if (userLocation)
                  setDestination({ lat: bin.latitude, lng: bin.longitude });
              },
            }}
          >
            <Popup>
              Dustbin #{bin.id}
              <br />
              Fill: {bin.fillLevel}%
              <br />
              Type: {bin.type || "Unknown"}
            </Popup>
          </Marker>
        ))}

        {userLocation && destination && (
          <Routing from={userLocation} to={destination} />
        )}
      </MapContainer>
    </div>
  );
}