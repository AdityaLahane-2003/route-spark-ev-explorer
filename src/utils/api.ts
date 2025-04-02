
import axios from 'axios';

const GEOAPIFY_API_KEY = ""; // Add your Geoapify API key here

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

// Function to find EV stations along a route
export const findEVStationsAlongRoute = async (
  routeGeometry: any, 
  radiusKm: number
): Promise<EVStation[]> => {
  try {
    // In a real app, we would send the route geometry to an API to find EV stations
    // For demonstration purposes, we'll generate some mock stations along the route
    return generateMockStations(routeGeometry, radiusKm);
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
  
  // Take a sample of coordinates to place stations
  const sampleStep = Math.max(1, Math.floor(coordinates.length / 5));
  const stationPoints = coordinates.filter((_: any, i: number) => i % sampleStep === 0);
  
  // Generate random stations near these points
  return stationPoints.map((coord: number[], index: number) => {
    // Add small random offset to make stations appear near route
    const randomOffset = (Math.random() - 0.5) * 0.01 * radiusKm;
    
    return {
      id: `station-${index}`,
      name: `EV Station ${index + 1}`,
      location: [
        coord[0] + randomOffset, 
        coord[1] + randomOffset
      ],
      address: `Near route point ${index + 1}`,
      connectors: [
        {
          type: ['CCS', 'CHAdeMO', 'Type 2'][Math.floor(Math.random() * 3)],
          power: [30, 50, 120, 250][Math.floor(Math.random() * 4)],
          available: Math.random() > 0.3
        },
        {
          type: ['CCS', 'CHAdeMO', 'Type 2'][Math.floor(Math.random() * 3)],
          power: [30, 50, 120, 250][Math.floor(Math.random() * 4)],
          available: Math.random() > 0.3
        }
      ],
      isAvailable: Math.random() > 0.2,
      isBusy: Math.random() > 0.7
    };
  });
};
