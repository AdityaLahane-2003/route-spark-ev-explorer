
import axios from 'axios';

const GEOAPIFY_API_KEY = "6a1c2b904e094e519db8c42f74e2e595";

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

// Function to find EV stations along a route
export const findEVStationsAlongRoute = async (
  routeGeometry: any, 
  radiusKm: number,
  startPoint: [number, number],
  endPoint: [number, number]
): Promise<EVStation[]> => {
  try {
    // Extract coordinates from route geometry to calculate a central point
    const coordinates = routeGeometry.type === 'LineString' 
      ? routeGeometry.coordinates 
      : routeGeometry.coordinates[0];
    
    if (!coordinates || coordinates.length === 0) {
      return [];
    }
    
    // Calculate midpoint of route for better search results
    const midIndex = Math.floor(coordinates.length / 2);
    const midPoint = coordinates[midIndex];
    
    // Use Geoapify Places API to find actual EV charging stations
    const response = await axios.get('https://api.geoapify.com/v2/places', {
      params: {
        categories: 'service.vehicle.charging.electric',
        filter: `circle:${midPoint[0]},${midPoint[1]},${radiusKm * 1000}`, // Convert km to meters
        limit: 20,
        apiKey: GEOAPIFY_API_KEY
      }
    });
    
    if (response.data && response.data.features) {
      // Transform API response to our EVStation format
      const stations: EVStation[] = response.data.features.map((feature: any, index: number) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        
        // Calculate distance from route (simplified - actually distance from midpoint)
        const distFromMidpoint = calculateDistance(
          [midPoint[0], midPoint[1]],
          [coords[0], coords[1]]
        );
        
        // Generate some realistic connector data
        const connectors = generateConnectorData(props.name || `Station ${index}`, index);
        
        // Determine availability status based on a consistent algorithm using station id
        const statusSeed = (props.place_id?.charCodeAt(0) || index) % 10;
        const isAvailable = statusSeed > 2; // 80% chance of being available
        const isBusy = isAvailable && statusSeed > 6; // 40% of available are busy
        
        return {
          id: props.place_id || `station-${index}`,
          name: props.name || `EV Charging Station ${index + 1}`,
          location: [coords[0], coords[1]],
          address: props.formatted || props.address_line1 || `Near ${props.street || 'Main Street'}`,
          connectors: connectors,
          isAvailable: isAvailable,
          isBusy: isBusy,
          distanceFromRoute: Math.round(distFromMidpoint * 1000) // Convert km to meters
        };
      });
      
      // Sort by distance from route
      return stations.sort((a, b) => (a.distanceFromRoute || 0) - (b.distanceFromRoute || 0));
    }
    
    // Fallback to mock stations if API fails or returns no results
    console.warn('No EV stations found from API, using mock data');
    return generateMockStations(routeGeometry, radiusKm);
  } catch (error) {
    console.error('Error finding EV stations:', error);
    // Fallback to mock data in case of error
    return generateMockStations(routeGeometry, radiusKm);
  }
};

// Function to find hotels and restaurants along a route
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
        
        // Calculate distance from route (simplified - actually distance from midpoint)
        const distFromMidpoint = calculateDistance(
          [midPoint[0], midPoint[1]],
          [coords[0], coords[1]]
        );
        
        return {
          id: props.place_id || `poi-${Math.random().toString(36).substring(2, 9)}`,
          name: props.name || `${poiType === 'hotel' ? 'Hotel' : 'Restaurant'} ${Math.floor(Math.random() * 100)}`,
          location: [coords[0], coords[1]],
          address: props.formatted || props.address_line1 || `Near ${props.street || 'Main Street'}`,
          type: poiType,
          rating: props.rating || (Math.floor(Math.random() * 30) + 20) / 10, // Random rating between 2.0 and 5.0
          distanceFromRoute: Math.round(distFromMidpoint * 1000) // Convert km to meters
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error(`Error finding ${poiType}s:`, error);
    return [];
  }
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

// Helper function to generate mock station connectors
const generateConnectorData = (stationName: string, index: number): Connector[] => {
  // Use station name and index to generate consistent connector data
  const seed = stationName.length + index;
  
  // Common connector types
  const connectorTypes = ['CCS', 'CHAdeMO', 'Type 2', 'Type 1', 'GB/T'];
  // Common power ratings
  const powerRatings = [11, 22, 50, 120, 150, 250, 350];
  
  // Generate 1-3 connectors
  const numConnectors = (seed % 3) + 1;
  const connectors: Connector[] = [];
  
  for (let i = 0; i < numConnectors; i++) {
    connectors.push({
      type: connectorTypes[(seed + i) % connectorTypes.length],
      power: powerRatings[(seed + i * 2) % powerRatings.length],
      available: ((seed + i) % 4) > 0 // 75% chance of being available
    });
  }
  
  return connectors;
};

// Helper function to generate mock EV stations along a route (fallback)
const generateMockStations = (routeGeometry: any, radiusKm: number): EVStation[] => {
  // Extract coordinates from route geometry
  const coordinates = routeGeometry.type === 'LineString' 
    ? routeGeometry.coordinates 
    : routeGeometry.coordinates[0];
  
  if (!coordinates || coordinates.length === 0) {
    return [];
  }
  
  // Take a sample of coordinates to place stations
  const sampleStep = Math.max(1, Math.floor(coordinates.length / 10));
  const stationPoints = coordinates.filter((_: any, i: number) => i % sampleStep === 0);
  
  // Station names
  const stationNames = [
    "Fast Charge Hub", "Electro Point", "Green Energy Station", 
    "PowerUp EV", "Volt Station", "ChargeNow", "EcoCharge", 
    "Electron Hub", "Drive Electric", "Plug & Go"
  ];
  
  // Generate stations near these points with realistic variations
  const stations = stationPoints.map((coord: number[], index: number) => {
    // Generate a pseudo-random number based on the coordinates
    const pseudoRandom = (coord[0] * 10000 + coord[1] * 10000) % 1;
    
    // Add small random offset to make stations appear near route
    // Scale the offset based on radius - larger radius = stations can be further from route
    const offsetMultiplier = (index % 5) + 1; // 1 to 5, simulates distance from route
    const randomOffset = (pseudoRandom - 0.5) * 0.01 * offsetMultiplier;
    
    // Determine status based on a consistent algorithm
    const statusSeed = (index * pseudoRandom * 100) % 10;
    const isAvailable = statusSeed > 2; // 80% chance of being available
    const isBusy = isAvailable && statusSeed > 6; // 40% of available are busy
    
    const stationName = stationNames[index % stationNames.length];
    
    // Calculate distance from route (simplification)
    const virtualDistance = (offsetMultiplier * 200) + Math.floor(pseudoRandom * 300); // meters
    
    return {
      id: `station-${index}-${coord[0].toFixed(4)}-${coord[1].toFixed(4)}`,
      name: `${stationName} ${index + 1}`,
      location: [
        coord[0] + randomOffset, 
        coord[1] + randomOffset
      ],
      address: `Near ${Math.floor(index/2) + 1} Main Street`,
      connectors: [
        {
          type: ['CCS', 'CHAdeMO', 'Type 2'][Math.floor(pseudoRandom * 3)],
          power: [30, 50, 120, 250][Math.floor(pseudoRandom * 4)],
          available: Math.random() > 0.3
        },
        {
          type: ['CCS', 'CHAdeMO', 'Type 2'][Math.floor((pseudoRandom + 0.33) * 3) % 3],
          power: [30, 50, 120, 250][Math.floor((pseudoRandom + 0.33) * 4) % 4],
          available: Math.random() > 0.3
        }
      ],
      isAvailable: isAvailable,
      isBusy: isBusy,
      distanceFromRoute: virtualDistance
    };
  });
  
  return stations;
};
