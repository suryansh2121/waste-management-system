import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { useEffect, useRef, useState } from 'react';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function Routing({ from, to }) {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(from.lat, from.lng),
        L.latLng(to.lat, to.lng)
      ],
      routeWhileDragging: false,
      show: false,
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [from, to]);

  return null;
}

export default function Map({ dustbins }) {
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      err => {
        console.error("Error getting location:", err);
      }
    );
  }, []);

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {dustbins.map((bin, index) => (
          <Marker
            key={index}
            position={[bin.latitude, bin.longitude]}
            eventHandlers={{
              click: () => {
                if (userLocation) {
                  setDestination({ lat: bin.latitude, lng: bin.longitude });
                }
              }
            }}
          >
            <Popup>
              Dustbin {index + 1}<br />
              Click for directions
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
