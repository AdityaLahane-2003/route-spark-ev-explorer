
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import MapComponent from '@/components/Map';
import StationDetails from '@/components/StationDetails';
import POIDetails from '@/components/POIDetails';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { 
  getRoute, 
  findEVStationsAlongRoute,
  findPOIsAlongRoute, 
  LocationSuggestion, 
  EVStation, 
  POI, 
  indianEVModels 
} from '@/utils/api';
import { Loader2, X } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  
  // Location state
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | undefined>();
  const [endCoords, setEndCoords] = useState<[number, number] | undefined>();
  
  // Search parameters
  const [searchRadius, setSearchRadius] = useState(2);
  const [batteryPercentage, setBatteryPercentage] = useState(80);
  const [selectedEVModel, setSelectedEVModel] = useState(indianEVModels[0].id);
  const [showHotels, setShowHotels] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  
  // Loading and route state
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    geometry: any;
    distance: number;
    duration: number;
  } | null>(null);
  
  // POI state
  const [evStations, setEVStations] = useState<EVStation[]>([]);
  const [hotels, setHotels] = useState<POI[]>([]);
  const [restaurants, setRestaurants] = useState<POI[]>([]);
  
  // Selected item state
  const [selectedStation, setSelectedStation] = useState<EVStation | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  
  // Cache for route data to ensure consistency
  const [routeCache, setRouteCache] = useState<{
    routeHash: string;
    evStations: EVStation[];
    hotels: POI[];
    restaurants: POI[];
  } | null>(null);
  
  // Handle location selection
  const handleStartLocationSelect = (location: LocationSuggestion) => {
    setStartLocation(location.name);
    setStartCoords(location.coordinates);
  };
  
  const handleEndLocationSelect = (location: LocationSuggestion) => {
    setEndLocation(location.name);
    setEndCoords(location.coordinates);
  };
  
  // Function to create a route hash for caching
  const createRouteHash = (start?: [number, number], end?: [number, number]): string => {
    if (!start || !end) return '';
    return `${start[0].toFixed(4)},${start[1].toFixed(4)}_${end[0].toFixed(4)},${end[1].toFixed(4)}`;
  };
  
  // Function to update POIs based on the current route and radius
  const updatePOIs = async (radius: number) => {
    if (!routeInfo || !startCoords || !endCoords) return;
    
    const routeHash = createRouteHash(startCoords, endCoords);
    
    // Check if we already have cached data for this route
    if (routeCache && routeCache.routeHash === routeHash) {
      // Filter based on radius
      const stationsWithinRadius = routeCache.evStations.filter(
        station => (station.distanceFromRoute || 0) <= radius * 1000
      );
      
      const hotelsWithinRadius = routeCache.hotels.filter(
        hotel => (hotel.distanceFromRoute || 0) <= radius * 1000
      );
      
      const restaurantsWithinRadius = routeCache.restaurants.filter(
        restaurant => (restaurant.distanceFromRoute || 0) <= radius * 1000
      );
      
      setEVStations(stationsWithinRadius);
      setHotels(hotelsWithinRadius);
      setRestaurants(restaurantsWithinRadius);
      
      toast({
        title: `Showing ${stationsWithinRadius.length} EV stations`,
        description: `Within ${radius} km radius of your route.`,
        action: (
          <button onClick={() => toast({ open: false })} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        )
      });
      
      return;
    }
    
    // If no cache or different route, fetch new data
    try {
      setIsLoading(true);
      
      // Get EV stations
      const stations = await findEVStationsAlongRoute(
        routeInfo.geometry, 
        radius,
        startCoords,
        endCoords
      );
      
      // Get hotels if enabled
      let hotelData: POI[] = [];
      if (showHotels) {
        hotelData = await findPOIsAlongRoute(routeInfo.geometry, radius, 'hotel');
      }
      
      // Get restaurants if enabled
      let restaurantData: POI[] = [];
      if (showRestaurants) {
        restaurantData = await findPOIsAlongRoute(routeInfo.geometry, radius, 'restaurant');
      }
      
      // Update state
      setEVStations(stations);
      setHotels(hotelData);
      setRestaurants(restaurantData);
      
      // Update cache
      setRouteCache({
        routeHash,
        evStations: stations,
        hotels: hotelData,
        restaurants: restaurantData
      });
      
      toast({
        title: `Found ${stations.length} EV stations`,
        description: stations.length > 0 
          ? `Within ${radius} km radius of your route.` 
          : `No charging stations found within ${radius} km of your route.`,
        action: (
          <button onClick={() => toast({ open: false })} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        ),
        variant: stations.length > 0 ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error("Error fetching POIs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update POIs when radius, hotels, or restaurants toggles change
  useEffect(() => {
    if (routeInfo) {
      updatePOIs(searchRadius);
    }
  }, [searchRadius, showHotels, showRestaurants]);
  
  // Function to handle search radius change
  const handleSearchRadiusChange = (radius: number) => {
    setSearchRadius(radius);
  };
  
  // Function to handle battery percentage change
  const handleBatteryPercentageChange = (percentage: number) => {
    setBatteryPercentage(percentage);
  };
  
  // Function to handle EV model change
  const handleEVModelChange = (modelId: string) => {
    setSelectedEVModel(modelId);
  };
  
  // Function to handle hotel toggle
  const handleShowHotelsChange = (show: boolean) => {
    setShowHotels(show);
  };
  
  // Function to handle restaurant toggle
  const handleShowRestaurantsChange = (show: boolean) => {
    setShowRestaurants(show);
  };
  
  // Main search function
  const handleSearch = async () => {
    if (!startCoords || !endCoords) {
      toast({
        title: "Missing locations",
        description: "Please select valid start and destination locations.",
        action: (
          <button onClick={() => toast({ open: false })} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        )
      });
      return;
    }
    
    setIsLoading(true);
    // Clear previous POIs
    setEVStations([]);
    setHotels([]);
    setRestaurants([]);
    setRouteCache(null);
    
    try {
      // Get route
      const route = await getRoute(startCoords, endCoords);
      
      if (route) {
        setRouteInfo({
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration
        });
        
        toast({
          title: "Route found",
          description: "Searching for charging stations and POIs along the route...",
          action: (
            <button onClick={() => toast({ open: false })} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          )
        });
        
        // Find EV stations and POIs
        await updatePOIs(searchRadius);
        
      } else {
        toast({
          title: "No route found",
          description: "Could not find a route between the specified locations.",
          variant: "destructive",
          action: (
            <button onClick={() => toast({ open: false })} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          )
        });
      }
    } catch (error) {
      console.error("Error searching route:", error);
      toast({
        title: "Error",
        description: "An error occurred while searching for the route.",
        variant: "destructive",
        action: (
          <button onClick={() => toast({ open: false })} className="ml-2">
            <X className="h-4 w-4" />
          </button>
        )
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStationClick = (station: EVStation) => {
    setSelectedStation(station);
    setSelectedPOI(null);
  };
  
  const handlePOIClick = (poi: POI) => {
    setSelectedPOI(poi);
    setSelectedStation(null);
  };
  
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen w-full"
    >
      <ResizablePanel
        defaultSize={25}
        minSize={20}
        maxSize={50}
        className="h-full"
      >
        <Sidebar
          startLocation={startLocation}
          endLocation={endLocation}
          searchRadius={searchRadius}
          batteryPercentage={batteryPercentage}
          selectedEVModel={selectedEVModel}
          showHotels={showHotels}
          showRestaurants={showRestaurants}
          isLoading={isLoading}
          routeDistance={routeInfo?.distance}
          routeDuration={routeInfo?.duration}
          onStartLocationChange={setStartLocation}
          onEndLocationChange={setEndLocation}
          onStartLocationSelect={handleStartLocationSelect}
          onEndLocationSelect={handleEndLocationSelect}
          onSearchRadiusChange={handleSearchRadiusChange}
          onBatteryPercentageChange={handleBatteryPercentageChange}
          onEVModelChange={handleEVModelChange}
          onShowHotelsChange={handleShowHotelsChange}
          onShowRestaurantsChange={handleShowRestaurantsChange}
          onSearch={handleSearch}
        />
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel defaultSize={75} className="h-full">
        <div className="h-full w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <p className="mt-2 text-gray-600">Finding the best route and charging stations...</p>
              </div>
            </div>
          ) : (
            <MapComponent
              startPoint={startCoords}
              endPoint={endCoords}
              routeGeometry={routeInfo?.geometry}
              evStations={evStations}
              hotels={showHotels ? hotels : []}
              restaurants={showRestaurants ? restaurants : []}
              onStationClick={handleStationClick}
              onPOIClick={handlePOIClick}
            />
          )}
        </div>
      </ResizablePanel>
      
      {/* Dialog for EV Station details */}
      <Dialog open={!!selectedStation} onOpenChange={(open) => !open && setSelectedStation(null)}>
        <DialogContent>
          {selectedStation && (
            <StationDetails
              station={selectedStation}
              selectedEVModel={selectedEVModel}
              batteryPercentage={batteryPercentage}
              onClose={() => setSelectedStation(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog for POI details */}
      <Dialog open={!!selectedPOI} onOpenChange={(open) => !open && setSelectedPOI(null)}>
        <DialogContent>
          {selectedPOI && (
            <POIDetails
              poi={selectedPOI}
              onClose={() => setSelectedPOI(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </ResizablePanelGroup>
  );
};

export default Index;
