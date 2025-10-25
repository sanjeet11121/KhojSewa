// components/LocationPicker.js
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for lost and found items
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const LocationMarker = ({ onLocationSelect, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const newPosition = { lat, lng };
      setPosition(newPosition);
      onLocationSelect(newPosition);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        Selected Location <br />
        Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
      </Popup>
    </Marker>
  );
};

const LocationPicker = ({ 
  onLocationSelect, 
  initialPosition = null,
  height = "400px",
  readonly = false
}) => {
  const defaultCenter = [27.7172, 85.3240]; // Kathmandu, Nepal

  return (
    <div className="location-picker rounded-lg overflow-hidden border border-gray-300">
      <MapContainer 
        center={initialPosition || defaultCenter} 
        zoom={13} 
        style={{ height, width: '100%' }}
        className="location-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readonly && (
          <LocationMarker 
            onLocationSelect={onLocationSelect} 
            initialPosition={initialPosition}
          />
        )}
        {readonly && initialPosition && (
          <Marker position={initialPosition}>
            <Popup>
              Item Location <br />
              Lat: {initialPosition.lat.toFixed(6)}, Lng: {initialPosition.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPicker;