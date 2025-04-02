
import axios from 'axios';

const GEOAPIFY_API_KEY = "6a1c2b904e094e519db8c42f74e2e595"; // Using the provided API key

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
}

// Interface for EV station connector
export interface Connector {
  type: string;
  power: number; // in kW
  available: boolean;
}

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

// Create a cache for storing stations by route hash
const stationsCache = new Map<string, EVStation[]>();

// Function to create a route hash
const createRouteHash = (geometry: any): string => {
  // Create a simplified hash of the start and end coordinates
  if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
    return '';
  }
  
  // Get first and last coordinate
  const coords = geometry.type === 'LineString' ? geometry.coordinates : geometry.coordinates[0];
  const start = coords[0];
  const end = coords[coords.length - 1];
  
  return `${start[0].toFixed(4)},${start[1].toFixed(4)}_${end[0].toFixed(4)},${end[1].toFixed(4)}`;
};

// Function to find EV stations along a route
export const findEVStationsAlongRoute = async (
  routeGeometry: any, 
  radiusKm: number
): Promise<EVStation[]> => {
  try {
    // In a real app, we would send the route geometry to an API to find EV stations
    // For demonstration purposes, we'll generate some consistent mock stations along the route
    
    // Create a hash for the route
    const routeHash = createRouteHash(routeGeometry);
    
    // If we don't have stations for this route yet, generate them
    if (!stationsCache.has(routeHash)) {
      const newStations = generateMockStations(routeGeometry, 5); // Generate with max radius
      stationsCache.set(routeHash, newStations);
    }
    
    // Get all stations for this route
    const allStations = stationsCache.get(routeHash) || [];
    
    // Filter stations based on radius
    // In a real implementation, we would associate each station with a distance from the route
    // Here we'll simulate this by using their index as a rough proxy for distance
    const stationsWithinRadius = allStations.filter((station, index) => {
      // Assign each station a "virtual distance" based on its index
      // Every station is spaced roughly 1km apart in our simulation
      const virtualDistanceFromRoute = (index % 5) + 1; // 1 to 5 km
      return virtualDistanceFromRoute <= radiusKm;
    });
    
    return stationsWithinRadius;
  } catch (error) {
    console.error('Error finding EV stations:', error);
    return [];
  }
};

// Helper function to generate mock EV stations along a route
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
  
  // Generate random stations near these points with realistic variations
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
      isBusy: isBusy
    };
  });
  
  return stations;
};
