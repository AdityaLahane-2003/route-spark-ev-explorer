
import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { EVStation, POI } from '@/utils/api';
import MapLegend from './MapLegend';

// Fix for default marker icon issue in React Leaflet
// See: https://stackoverflow.com/questions/49441600/react-leaflet-marker-files-not-found
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

// Create custom marker icons
const startIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// EV station icons based on status
const availableStationIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const busyStationIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const unavailableStationIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icons for hotels and restaurants
const hotelIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to fit the map to bounds
interface FitBoundsProps {
  startPoint?: [number, number]; // [lng, lat]
  endPoint?: [number, number]; // [lng, lat]
  routePoints?: [number, number][]; // Array of [lng, lat]
}

const FitBounds: React.FC<FitBoundsProps> = ({ startPoint, endPoint, routePoints }) => {
  const map = useMap();
  
  useEffect(() => {
    if (routePoints && routePoints.length > 0) {
      // Convert from [lng, lat] to [lat, lng] for Leaflet
      const bounds = routePoints.map(point => [point[1], point[0]] as [number, number]);
      map.fitBounds(bounds);
    } else if (startPoint && endPoint) {
      // Create bounds from start and end points
      const bounds = [
        [startPoint[1], startPoint[0]] as [number, number],
        [endPoint[1], endPoint[0]] as [number, number]
      ];
      map.fitBounds(bounds);
    }
  }, [map, startPoint, endPoint, routePoints]);
  
  return null;
};

// Function to get the right icon based on station status
const getStationIcon = (station: EVStation) => {
  if (!station.isAvailable) {
    return unavailableStationIcon;
  } else if (station.isBusy) {
    return busyStationIcon;
  }
  return availableStationIcon;
};

// Function to get the right icon for POIs
const getPOIIcon = (poi: POI) => {
  return poi.type === 'hotel' ? hotelIcon : restaurantIcon;
};

interface MapComponentProps {
  startPoint?: [number, number]; // [lng, lat]
  endPoint?: [number, number]; // [lng, lat]
  routeGeometry?: any; // GeoJSON LineString or array of coordinates
  evStations: EVStation[];
  hotels: POI[];
  restaurants: POI[];
  onStationClick: (station: EVStation) => void;
  onPOIClick: (poi: POI) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  startPoint,
  endPoint,
  routeGeometry,
  evStations,
  hotels,
  restaurants,
  onStationClick,
  onPOIClick
}) => {
  // Parse route coordinates from geometry
  const routeCoordinates = routeGeometry 
    ? (routeGeometry.type === 'LineString' 
        ? routeGeometry.coordinates 
        : routeGeometry.coordinates[0])
    : [];
  
  // Convert from [lng, lat] to [lat, lng] for Leaflet Polyline
  const routePoints = routeCoordinates.map((coord: number[]) => [coord[1], coord[0]]);
  
  // Define default center if no points are provided
  const defaultCenter: [number, number] = [20, 0]; // Center of the world map
  const center: [number, number] = startPoint ? [startPoint[1], startPoint[0]] : defaultCenter;
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {startPoint && (
          <Marker 
            position={[startPoint[1], startPoint[0]]} 
            icon={startIcon}
          >
            <Popup>Starting Point</Popup>
          </Marker>
        )}
        
        {endPoint && (
          <Marker 
            position={[endPoint[1], endPoint[0]]} 
            icon={endIcon}
          >
            <Popup>Destination</Popup>
          </Marker>
        )}
        
        {routePoints.length > 0 && (
          <Polyline 
            positions={routePoints}
            color="#2563eb"
            weight={5}
            opacity={0.7}
          />
        )}
        
        {/* Render EV Stations */}
        {evStations.map((station) => (
          <Marker
            key={station.id}
            position={[station.location[1], station.location[0]]}
            icon={getStationIcon(station)}
            eventHandlers={{
              click: () => onStationClick(station)
            }}
          >
            <Popup>
              <div className="font-medium">{station.name}</div>
              <div className="text-sm">{station.address}</div>
              <div className="text-sm mt-1">
                Status: {station.isAvailable 
                  ? (station.isBusy ? "Busy" : "Available") 
                  : "Unavailable"}
              </div>
              {station.distanceFromRoute && (
                <div className="text-sm">Distance from route: {station.distanceFromRoute}m</div>
              )}
            </Popup>
          </Marker>
        ))}
        
        {/* Render Hotels */}
        {hotels.map((hotel) => (
          <Marker
            key={hotel.id}
            position={[hotel.location[1], hotel.location[0]]}
            icon={hotelIcon}
            eventHandlers={{
              click: () => onPOIClick(hotel)
            }}
          >
            <Popup>
              <div className="font-medium">{hotel.name}</div>
              <div className="text-sm">{hotel.address}</div>
              {hotel.rating && (
                <div className="text-sm">Rating: {hotel.rating}/5</div>
              )}
              {hotel.distanceFromRoute && (
                <div className="text-sm">Distance from route: {hotel.distanceFromRoute}m</div>
              )}
            </Popup>
          </Marker>
        ))}
        
        {/* Render Restaurants */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.location[1], restaurant.location[0]]}
            icon={restaurantIcon}
            eventHandlers={{
              click: () => onPOIClick(restaurant)
            }}
          >
            <Popup>
              <div className="font-medium">{restaurant.name}</div>
              <div className="text-sm">{restaurant.address}</div>
              {restaurant.rating && (
                <div className="text-sm">Rating: {restaurant.rating}/5</div>
              )}
              {restaurant.distanceFromRoute && (
                <div className="text-sm">Distance from route: {restaurant.distanceFromRoute}m</div>
              )}
            </Popup>
          </Marker>
        ))}
        
        {(startPoint || endPoint || routePoints.length > 0) && (
          <FitBounds 
            startPoint={startPoint}
            endPoint={endPoint}
            routePoints={routeCoordinates}
          />
        )}
      </MapContainer>
      <MapLegend showPOI={!!(hotels.length || restaurants.length)} />
    </div>
  );
};

export default MapComponent;
