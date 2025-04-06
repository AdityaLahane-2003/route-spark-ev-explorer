
import axios from 'axios';

const GEOAPIFY_API_KEY = "6a1c2b904e094e519db8c42f74e2e595";
const OPEN_CHARGE_MAP_API_KEY = "6978e506-213c-41cd-babd-04979455db68";

// Interface for location search results
export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
}

// Interface for route information
export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: any; // GeoJSON representing the route
}

// Interface for EV station
export interface EVStation {
  id: string;
  name: string;
  location: [number, number]; // [lng, lat]
  address: string;
  connectors: Connector[];
  isAvailable: boolean;
  isBusy: boolean;
  distanceFromRoute?: number; // distance from route in meters
  distanceFromStart?: number; // distance from start point along route
}

// Interface for hotels and restaurants
export interface POI {
  id: string;
  name: string;
  location: [number, number]; // [lng, lat]
  address: string;
  type: 'hotel' | 'restaurant';
  rating?: number;
  distanceFromRoute?: number; // distance from route in meters
}

// Interface for EV station connector
export interface Connector {
  type: string;
  power: number; // in kW
  available: boolean;
}

// Indian EV car models with their battery capacities and ranges
export interface EVModel {
  id: string;
  name: string;
  batteryCapacity: number; // in kWh
  range: number; // in km
  chargingSpeed: number; // Average charging speed in kW
}

// List of Indian EV models
export const indianEVModels: EVModel[] = [
  { id: 'tata-nexon', name: 'Tata Nexon EV', batteryCapacity: 40.5, range: 465, chargingSpeed: 50 },
  { id: 'tata-tigor', name: 'Tata Tigor EV', batteryCapacity: 26, range: 306, chargingSpeed: 25 },
  { id: 'mahindra-xuv400', name: 'Mahindra XUV400', batteryCapacity: 39.4, range: 456, chargingSpeed: 50 },
  { id: 'mg-zs', name: 'MG ZS EV', batteryCapacity: 50.3, range: 461, chargingSpeed: 76 },
  { id: 'hyundai-kona', name: 'Hyundai Kona Electric', batteryCapacity: 39.2, range: 452, chargingSpeed: 50 },
  { id: 'kia-ev6', name: 'Kia EV6', batteryCapacity: 77.4, range: 708, chargingSpeed: 240 },
  { id: 'bmw-i4', name: 'BMW i4', batteryCapacity: 83.9, range: 590, chargingSpeed: 200 },
  { id: 'byd-e6', name: 'BYD e6', batteryCapacity: 71.7, range: 415, chargingSpeed: 60 },
  { id: 'mercedes-eqc', name: 'Mercedes-Benz EQC', batteryCapacity: 80, range: 471, chargingSpeed: 110 },
  { id: 'volvo-xc40', name: 'Volvo XC40 Recharge', batteryCapacity: 78, range: 418, chargingSpeed: 150 },
  { id: 'audi-etron', name: 'Audi e-tron', batteryCapacity: 95, range: 484, chargingSpeed: 150 },
  { id: 'jaguar-ipace', name: 'Jaguar I-PACE', batteryCapacity: 90, range: 470, chargingSpeed: 100 },
];

// Function to search for locations
export const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query.trim()) return [];
  
  try {
    const response = await axios.get(`https://api.geoapify.com/v1/geocode/autocomplete`, {
      params: {
        text: query,
        format: 'json',
        apiKey: GEOAPIFY_API_KEY
      }
    });
    
    if (response.data && response.data.results) {
      return response.data.results.map((result: any) => ({
        id: result.place_id || Math.random().toString(),
        name: result.formatted || result.name || 'Unknown location',
        address: result.formatted || '',
        coordinates: [result.lon, result.lat]
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching for locations:', error);
    return [];
  }
};

// Function to get route between two points
export const getRoute = async (
  start: [number, number], 
  end: [number, number]
): Promise<RouteInfo | null> => {
  try {
    const response = await axios.get(`https://api.geoapify.com/v1/routing`, {
      params: {
        waypoints: `${start[1]},${start[0]}|${end[1]},${end[0]}`,
        mode: 'drive',
        apiKey: GEOAPIFY_API_KEY
      }
    });
    
    if (response.data && response.data.features && response.data.features.length > 0) {
      const route = response.data.features[0];
      return {
        distance: route.properties.distance,
        duration: route.properties.time,
        geometry: route.geometry
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
};

// Function to find EV stations along a route using OpenChargeMap API
export const findEVStationsAlongRoute = async (
  routeGeometry: any, 
  radiusKm: number,
  startPoint: [number, number],
  endPoint: [number, number]
): Promise<EVStation[]> => {
  try {
    // Extract coordinates from route geometry to calculate search points
    const coordinates = routeGeometry.type === 'LineString' 
      ? routeGeometry.coordinates 
      : routeGeometry.coordinates[0];
    
    if (!coordinates || coordinates.length === 0) {
      return [];
    }
    
    // For a route, we'll query multiple points along the route to ensure coverage
    const searchPoints = [];
    const totalPoints = coordinates.length;
    
    // Add points at regular intervals (every 10% of the route)
    for (let i = 0; i < totalPoints; i += Math.max(1, Math.floor(totalPoints / 10))) {
      searchPoints.push(coordinates[i]);
    }
    
    // Ensure we have the start, middle and end points
    if (!searchPoints.includes(coordinates[0])) {
      searchPoints.unshift(coordinates[0]);
    }
    
    const midIndex = Math.floor(totalPoints / 2);
    if (!searchPoints.includes(coordinates[midIndex])) {
      searchPoints.splice(Math.floor(searchPoints.length / 2), 0, coordinates[midIndex]);
    }
    
    if (!searchPoints.includes(coordinates[totalPoints - 1])) {
      searchPoints.push(coordinates[totalPoints - 1]);
    }

    // Create promises for all search points
    const stationPromises = searchPoints.map(point => {
      return fetchEVStationsNearPoint(point, radiusKm);
    });

    // Execute all promises
    const stationResults = await Promise.all(stationPromises);
    
    // Flatten and deduplicate stations based on ID
    const stationsMap = new Map<string, EVStation>();
    
    stationResults.flat().forEach(station => {
      if (!stationsMap.has(station.id)) {
        // Calculate distance from route (using closest point approximation)
        const distanceFromRoute = calculateMinDistanceFromRoute(
          [station.location[0], station.location[1]],
          coordinates
        );
        
        // Estimate distance from start along the route
        const distanceFromStart = estimateDistanceAlongRoute(
          [station.location[0], station.location[1]],
          coordinates,
          startPoint
        );
        
        stationsMap.set(station.id, {
          ...station,
          distanceFromRoute: Math.round(distanceFromRoute * 1000), // Convert km to meters
          distanceFromStart: Math.round(distanceFromStart * 1000) // Convert km to meters
        });
      }
    });
    
    // Convert map back to array and sort by distance from start
    const stations = Array.from(stationsMap.values());
    return stations.sort((a, b) => (a.distanceFromStart || 0) - (b.distanceFromStart || 0));
  } catch (error) {
    console.error('Error finding EV stations:', error);
    return [];
  }
};

// Estimate the distance along the route for a given point
const estimateDistanceAlongRoute = (
  point: [number, number],
  routeCoordinates: number[][],
  startPoint: [number, number]
): number => {
  let closestPointIndex = 0;
  let minDistance = Infinity;
  
  // Find the closest point on the route
  for (let i = 0; i < routeCoordinates.length; i++) {
    const coord = routeCoordinates[i];
    const distance = calculateDistance(point, [coord[0], coord[1]]);
    if (distance < minDistance) {
      minDistance = distance;
      closestPointIndex = i;
    }
  }
  
  // Calculate the distance from start to the closest point on the route
  let distanceAlongRoute = 0;
  for (let i = 0; i < closestPointIndex; i++) {
    distanceAlongRoute += calculateDistance(
      [routeCoordinates[i][0], routeCoordinates[i][1]],
      [routeCoordinates[i+1][0], routeCoordinates[i+1][1]]
    );
  }
  
  return distanceAlongRoute;
};

// Helper function to fetch EV stations near a point using OpenChargeMap API
const fetchEVStationsNearPoint = async (
  point: number[], 
  radiusKm: number
): Promise<EVStation[]> => {
  try {
    // OpenChargeMap uses lat,lng format
    const response = await axios.get('https://api.openchargemap.io/v3/poi', {
      params: {
        latitude: point[1],
        longitude: point[0],
        distance: radiusKm,
        distanceunit: 'km',
        maxresults: 50,
        compact: true,
        verbose: false,
        key: OPEN_CHARGE_MAP_API_KEY
      }
    });
    
    if (!response.data || !response.data.length) {
      return [];
    }
    
    // Transform API response to our EVStation format
    return response.data.map((station: any) => {
      // Extract connector information
      const connectors = station.Connections?.map((conn: any) => ({
        type: conn.ConnectionType?.Title || 'Unknown',
        power: conn.PowerKW || (conn.Level?.Title === 'Level 2' ? 22 : 50),
        available: conn.StatusType?.IsOperational !== false
      })) || [];
      
      // Determine availability status based on station status
      const statusType = station.StatusType?.IsOperational;
      const isAvailable = statusType !== false; // Consider available unless explicitly marked unavailable
      
      // Estimate busyness (this is a simplification, OpenChargeMap doesn't provide real-time busyness)
      const isBusy = isAvailable && (station.UsageType?.ID === 6 || station.UsageCost === 'High'); // 6 = Private with paid access
      
      return {
        id: `ocm-${station.ID}`,
        name: station.AddressInfo?.Title || `Charging Station ${station.ID}`,
        location: [
          station.AddressInfo?.Longitude || 0,
          station.AddressInfo?.Latitude || 0
        ],
        address: formatStationAddress(station.AddressInfo),
        connectors: connectors.length ? connectors : [{ type: 'Type 2', power: 22, available: true }],
        isAvailable,
        isBusy
      };
    });
  } catch (error) {
    console.error('Error fetching EV stations from OpenChargeMap:', error);
    return [];
  }
};

// Helper function to format station address
const formatStationAddress = (addressInfo: any): string => {
  if (!addressInfo) return 'No address information';
  
  const components = [];
  if (addressInfo.AddressLine1) components.push(addressInfo.AddressLine1);
  if (addressInfo.Town) components.push(addressInfo.Town);
  if (addressInfo.StateOrProvince) components.push(addressInfo.StateOrProvince);
  if (addressInfo.Postcode) components.push(addressInfo.Postcode);
  if (addressInfo.Country?.Title) components.push(addressInfo.Country.Title);
  
  return components.join(', ') || 'No address information';
};

// Function to find POIs along a route
export const findPOIsAlongRoute = async (
  routeGeometry: any,
  radiusKm: number,
  poiType: 'hotel' | 'restaurant'
): Promise<POI[]> => {
  try {
    // Extract coordinates to calculate a central search point
    const coordinates = routeGeometry.type === 'LineString' 
      ? routeGeometry.coordinates 
      : routeGeometry.coordinates[0];
    
    if (!coordinates || coordinates.length === 0) {
      return [];
    }
    
    // Calculate midpoint of route for search
    const midIndex = Math.floor(coordinates.length / 2);
    const midPoint = coordinates[midIndex];
    
    // Map POI type to Geoapify category
    const category = poiType === 'hotel' ? 'accommodation.hotel' : 'catering.restaurant';
    
    // Use Geoapify Places API to find POIs
    const response = await axios.get('https://api.geoapify.com/v2/places', {
      params: {
        categories: category,
        filter: `circle:${midPoint[0]},${midPoint[1]},${radiusKm * 1000}`, // Convert km to meters
        limit: 10,
        apiKey: GEOAPIFY_API_KEY
      }
    });
    
    if (response.data && response.data.features) {
      // Transform API response to our POI format
      return response.data.features.map((feature: any) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        
        // Calculate distance from route
        const distanceFromRoute = calculateMinDistanceFromRoute(
          [coords[0], coords[1]],
          coordinates
        );
        
        return {
          id: props.place_id || `poi-${Math.random().toString(36).substring(2, 9)}`,
          name: props.name || `${poiType === 'hotel' ? 'Hotel' : 'Restaurant'} ${Math.floor(Math.random() * 100)}`,
          location: [coords[0], coords[1]],
          address: props.formatted || props.address_line1 || `Near ${props.street || 'Main Street'}`,
          type: poiType,
          rating: props.rating || (Math.floor(Math.random() * 30) + 20) / 10, // Random rating between 2.0 and 5.0
          distanceFromRoute: Math.round(distanceFromRoute * 1000) // Convert km to meters
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error(`Error finding ${poiType}s:`, error);
    return [];
  }
};

// Calculate minimum distance from a point to a route (using closest point approximation)
const calculateMinDistanceFromRoute = (point: [number, number], routeCoordinates: number[][]): number => {
  let minDistance = Infinity;
  
  for (const coord of routeCoordinates) {
    const distance = calculateDistance(point, [coord[0], coord[1]]);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }
  
  return minDistance;
};

// Calculate distance between two points in km (Haversine formula)
export const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (point2[1] - point1[1]) * Math.PI / 180;
  const dLon = (point2[0] - point1[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1[1] * Math.PI / 180) * Math.cos(point2[1] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

// Calculate charging time based on battery capacity, current percentage, and charging power
export const calculateChargingTime = (
  batteryCapacity: number, // kWh
  currentPercentage: number, // 0-100
  targetPercentage: number, // 0-100
  chargingPower: number // kW
): number => {
  // Amount of energy needed in kWh
  const energyNeeded = batteryCapacity * (targetPercentage - currentPercentage) / 100;
  
  // Time needed in hours
  const hoursNeeded = energyNeeded / chargingPower;
  
  // Convert to minutes
  return Math.round(hoursNeeded * 60);
};
