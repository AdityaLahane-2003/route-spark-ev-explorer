import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import MapComponent from '@/components/Map';
import StationDetails from '@/components/StationDetails';
import POIDetails from '@/components/POIDetails';
import RouteJourney from '@/components/RouteJourney';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MapLegend } from '@/components/MapLegend';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
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
import { Loader2, X, ChevronRight, ChevronLeft, Map } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | undefined>();
  const [endCoords, setEndCoords] = useState<[number, number] | undefined>();
  
  const [searchRadius, setSearchRadius] = useState(2);
  const [batteryPercentage, setBatteryPercentage] = useState(80);
  const [selectedEVModel, setSelectedEVModel] = useState(indianEVModels[0].id);
  const [showHotels, setShowHotels] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isJourneyVisible, setIsJourneyVisible] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    geometry: any;
    distance: number;
    duration: number;
  } | null>(null);
  
  const [evStations, setEVStations] = useState<EVStation[]>([]);
  const [hotels, setHotels] = useState<POI[]>([]);
  const [restaurants, setRestaurants] = useState<POI[]>([]);
  
  const [selectedStation, setSelectedStation] = useState<EVStation | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  
  const [routeCache, setRouteCache] = useState<{
    routeHash: string;
    evStations: EVStation[];
    hotels: POI[];
    restaurants: POI[];
  } | null>(null);
  
  const selectedModelObject = indianEVModels.find(model => model.id === selectedEVModel) || indianEVModels[0];
  
  const handleStartLocationSelect = (location: LocationSuggestion) => {
    setStartLocation(location.name);
    setStartCoords(location.coordinates);
  };
  
  const handleEndLocationSelect = (location: LocationSuggestion) => {
    setEndLocation(location.name);
    setEndCoords(location.coordinates);
  };
  
  const createRouteHash = (start?: [number, number], end?: [number, number]): string => {
    if (!start || !end) return '';
    return `${start[0].toFixed(4)},${start[1].toFixed(4)}_${end[0].toFixed(4)},${end[1].toFixed(4)}`;
  };
  
  const updatePOIs = async (radius: number) => {
    if (!routeInfo || !startCoords || !endCoords) return;
    
    const routeHash = createRouteHash(startCoords, endCoords);
    
    if (routeCache && routeCache.routeHash === routeHash) {
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
    
    try {
      setIsLoading(true);
      
      const stations = await findEVStationsAlongRoute(
        routeInfo.geometry, 
        radius,
        startCoords,
        endCoords
      );
      
      let hotelData: POI[] = [];
      if (showHotels) {
        hotelData = await findPOIsAlongRoute(routeInfo.geometry, radius, 'hotel');
      }
      
      let restaurantData: POI[] = [];
      if (showRestaurants) {
        restaurantData = await findPOIsAlongRoute(routeInfo.geometry, radius, 'restaurant');
      }
      
      setEVStations(stations);
      setHotels(hotelData);
      setRestaurants(restaurantData);
      
      if (stations.length > 0) {
        setIsJourneyVisible(true);
      }
      
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

  useEffect(() => {
    if (routeInfo) {
      updatePOIs(searchRadius);
    }
  }, [searchRadius, showHotels, showRestaurants]);
  
  const handleSearchRadiusChange = (radius: number) => {
    setSearchRadius(radius);
  };
  
  const handleBatteryPercentageChange = (percentage: number) => {
    setBatteryPercentage(percentage);
  };
  
  const handleEVModelChange = (modelId: string) => {
    setSelectedEVModel(modelId);
  };
  
  const handleShowHotelsChange = (show: boolean) => {
    setShowHotels(show);
  };
  
  const handleShowRestaurantsChange = (show: boolean) => {
    setShowRestaurants(show);
  };
  
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
    setEVStations([]);
    setHotels([]);
    setRestaurants([]);
    setRouteCache(null);
    
    try {
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

  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  return (
    <div className="h-screen w-full flex flex-col">
      {isMobile ? (
        <div className="h-screen flex flex-col">
          <div className="relative flex-grow">
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
            <MapLegend showPOI={showHotels || showRestaurants} />
            
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-4 left-4 z-10"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-[350px] p-0">
                <div className="h-full overflow-y-auto">
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
                  
                  {evStations.length > 0 && (
                    <div className="px-4 pb-4">
                      <RouteJourney
                        startLocation={startLocation}
                        endLocation={endLocation}
                        evStations={evStations}
                        selectedEVModel={selectedModelObject}
                        batteryPercentage={batteryPercentage}
                      />
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            {evStations.length > 0 && (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button 
                    className="absolute bottom-4 left-4 z-10"
                    size="sm"
                  >
                    View Journey Plan
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="max-h-[90vh]">
                  <div className="p-4 max-h-[80vh] overflow-y-auto">
                    <RouteJourney
                      startLocation={startLocation}
                      endLocation={endLocation}
                      evStations={evStations}
                      selectedEVModel={selectedModelObject}
                      batteryPercentage={batteryPercentage}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white p-5 rounded-lg shadow flex items-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-3 text-primary" />
                  <span className="text-lg">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ResizablePanelGroup
          direction="horizontal"
          className="h-screen w-full"
        >
          <ResizablePanel
            defaultSize={25}
            minSize={20}
            maxSize={50}
            className="h-full overflow-hidden"
            collapsible
            collapsedSize={0}
            onCollapse={() => setIsSidebarVisible(false)}
            onExpand={() => setIsSidebarVisible(true)}
          >
            <div className={`h-full transition-opacity overflow-y-auto ${isSidebarVisible ? 'opacity-100' : 'opacity-0'}`}>
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
              
              {evStations.length > 0 && routeInfo && (
                <div className="px-4 pb-4">
                  <RouteJourney
                    startLocation={startLocation}
                    endLocation={endLocation}
                    evStations={evStations}
                    selectedEVModel={selectedModelObject}
                    batteryPercentage={batteryPercentage}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="transition-opacity" />
          
          <ResizablePanel defaultSize={75} className="h-full">
            {isJourneyVisible && evStations.length > 0 ? (
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={50} className="relative">
                  <div className="relative h-full w-full">
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
                    <MapLegend showPOI={showHotels || showRestaurants} />
                    
                    {!isSidebarVisible && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="absolute top-4 left-4 z-10"
                        onClick={() => setIsSidebarVisible(true)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="absolute bottom-4 right-4 z-10"
                      onClick={() => setIsJourneyVisible(!isJourneyVisible)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-white p-5 rounded-lg shadow flex items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-3 text-primary" />
                          <span className="text-lg">Loading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel defaultSize={30} className="bg-white p-4 overflow-auto">
                  <RouteJourney
                    startLocation={startLocation}
                    endLocation={endLocation}
                    evStations={evStations}
                    selectedEVModel={selectedModelObject}
                    batteryPercentage={batteryPercentage}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="relative h-full w-full">
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
                <MapLegend showPOI={showHotels || showRestaurants} />
                
                {!isSidebarVisible && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="absolute top-4 left-4 z-10"
                    onClick={() => setIsSidebarVisible(true)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                
                {evStations.length > 0 && !isJourneyVisible && (
                  <Button 
                    className="absolute bottom-4 right-4 z-10"
                    size="sm"
                    onClick={() => setIsJourneyVisible(true)}
                  >
                    View Journey Plan
                  </Button>
                )}
                
                {isLoading && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white p-5 rounded-lg shadow flex items-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-3 text-primary" />
                      <span className="text-lg">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      
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
    </div>
  );
};

const ChevronDown = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default Index;
