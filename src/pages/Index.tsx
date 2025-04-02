
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/Sidebar';
import MapComponent from '@/components/Map';
import StationDetails from '@/components/StationDetails';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getRoute, findEVStationsAlongRoute, LocationSuggestion, EVStation } from '@/utils/api';
import { X } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | undefined>();
  const [endCoords, setEndCoords] = useState<[number, number] | undefined>();
  const [searchRadius, setSearchRadius] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    geometry: any;
    distance: number;
    duration: number;
  } | null>(null);
  const [evStations, setEVStations] = useState<EVStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<EVStation | null>(null);
  
  const handleStartLocationSelect = (location: LocationSuggestion) => {
    setStartCoords(location.coordinates);
  };
  
  const handleEndLocationSelect = (location: LocationSuggestion) => {
    setEndCoords(location.coordinates);
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
          description: "Searching for EV stations along the route...",
          action: (
            <button onClick={() => toast({ open: false })} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          )
        });
        
        // Find EV stations
        const stations = await findEVStationsAlongRoute(route.geometry, searchRadius);
        setEVStations(stations);
        
        toast({
          title: `Found ${stations.length} EV stations`,
          description: `Within ${searchRadius} km radius of your route.`,
          action: (
            <button onClick={() => toast({ open: false })} className="ml-2">
              <X className="h-4 w-4" />
            </button>
          )
        });
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
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="md:w-1/3 lg:w-1/4 h-auto md:h-full overflow-auto border-r">
        <Sidebar
          startLocation={startLocation}
          endLocation={endLocation}
          searchRadius={searchRadius}
          isLoading={isLoading}
          routeDistance={routeInfo?.distance}
          routeDuration={routeInfo?.duration}
          onStartLocationChange={setStartLocation}
          onEndLocationChange={setEndLocation}
          onStartLocationSelect={handleStartLocationSelect}
          onEndLocationSelect={handleEndLocationSelect}
          onSearchRadiusChange={setSearchRadius}
          onSearch={handleSearch}
        />
      </div>
      
      <div className="flex-1 h-[60vh] md:h-full">
        <MapComponent
          startPoint={startCoords}
          endPoint={endCoords}
          routeGeometry={routeInfo?.geometry}
          evStations={evStations}
          onStationClick={handleStationClick}
        />
      </div>
      
      <Dialog open={!!selectedStation} onOpenChange={(open) => !open && setSelectedStation(null)}>
        <DialogContent>
          {selectedStation && (
            <StationDetails
              station={selectedStation}
              onClose={() => setSelectedStation(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
