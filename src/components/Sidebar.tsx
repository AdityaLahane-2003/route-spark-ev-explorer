
import React from 'react';
import LocationSearchInput from './LocationSearchInput';
import { LocationSuggestion } from '@/utils/api';
import { Search, Battery, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SidebarProps {
  startLocation: string;
  endLocation: string;
  searchRadius: number;
  isLoading: boolean;
  routeDistance?: number;
  routeDuration?: number;
  onStartLocationChange: (value: string) => void;
  onEndLocationChange: (value: string) => void;
  onStartLocationSelect: (location: LocationSuggestion) => void;
  onEndLocationSelect: (location: LocationSuggestion) => void;
  onSearchRadiusChange: (radius: number) => void;
  onSearch: () => void;
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  } else {
    return `${minutes} min`;
  }
};

const formatDistance = (meters: number): string => {
  const kilometers = meters / 1000;
  return `${kilometers.toFixed(1)} km`;
};

const Sidebar: React.FC<SidebarProps> = ({
  startLocation,
  endLocation,
  searchRadius,
  isLoading,
  routeDistance,
  routeDuration,
  onStartLocationChange,
  onEndLocationChange,
  onStartLocationSelect,
  onEndLocationSelect,
  onSearchRadiusChange,
  onSearch
}) => {
  const hasRouteInfo = routeDistance !== undefined && routeDuration !== undefined;
  
  return (
    <div className="bg-white p-4 h-full w-full max-w-md flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Go Anywhere</h1>
        <p className="text-gray-600">Find EV charging stations along your route.</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <LocationSearchInput
            placeholder="Start location"
            value={startLocation}
            onChange={onStartLocationChange}
            onSelect={onStartLocationSelect}
          />
        </div>
        
        <div>
          <LocationSearchInput
            placeholder="Destination"
            value={endLocation}
            onChange={onEndLocationChange}
            onSelect={onEndLocationSelect}
          />
        </div>
        
        <Button 
          className="w-full"
          variant="outline"
        >
          <Zap className="h-5 w-5 mr-2" />
          Electric Car
        </Button>
        
        <div>
          <h3 className="font-medium mb-2">EV Station Search Radius</h3>
          <RadioGroup 
            defaultValue="5" 
            value={searchRadius.toString()}
            onValueChange={(value) => onSearchRadiusChange(parseInt(value))}
            className="flex space-x-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="1" id="r1" />
              <Label htmlFor="r1">1 km</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="2" id="r2" />
              <Label htmlFor="r2">2 km</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="3" id="r3" />
              <Label htmlFor="r3">3 km</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="4" id="r4" />
              <Label htmlFor="r4">4 km</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="5" id="r5" />
              <Label htmlFor="r5">5 km</Label>
            </div>
          </RadioGroup>
        </div>
        
        <Button 
          onClick={onSearch}
          disabled={isLoading || !startLocation || !endLocation}
          className="w-full"
        >
          <Search className="h-5 w-5 mr-2" />
          Get Route
        </Button>
      </div>
      
      {hasRouteInfo && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-xl font-semibold mb-4">Route Information</h3>
          
          <div className="mb-4">
            <p className="text-lg font-medium">
              {startLocation} → {endLocation}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-gray-600">Distance</h4>
              <p className="text-lg font-medium">{formatDistance(routeDistance)}</p>
            </div>
            <div>
              <h4 className="text-gray-600">EV Travel Time</h4>
              <p className="text-lg font-medium">{formatDuration(routeDuration)}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-auto text-xs text-gray-500 pt-4">
        © {new Date().getFullYear()} EV Route Explorer. Using OpenStreetMap and Geoapify.
      </div>
    </div>
  );
};

export default Sidebar;
