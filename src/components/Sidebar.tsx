
import React, { useState } from 'react';
import LocationSearchInput from './LocationSearchInput';
import { LocationSuggestion, EVModel, indianEVModels } from '@/utils/api';
import { Search, Battery, Zap, Hotel, UtensilsCrossed, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface SidebarProps {
  startLocation: string;
  endLocation: string;
  searchRadius: number;
  batteryPercentage: number;
  selectedEVModel: string;
  showHotels: boolean;
  showRestaurants: boolean;
  isLoading: boolean;
  routeDistance?: number;
  routeDuration?: number;
  onStartLocationChange: (value: string) => void;
  onEndLocationChange: (value: string) => void;
  onStartLocationSelect: (location: LocationSuggestion) => void;
  onEndLocationSelect: (location: LocationSuggestion) => void;
  onSearchRadiusChange: (radius: number) => void;
  onBatteryPercentageChange: (percentage: number) => void;
  onEVModelChange: (modelId: string) => void;
  onShowHotelsChange: (show: boolean) => void;
  onShowRestaurantsChange: (show: boolean) => void;
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
  batteryPercentage,
  selectedEVModel,
  showHotels,
  showRestaurants,
  isLoading,
  routeDistance,
  routeDuration,
  onStartLocationChange,
  onEndLocationChange,
  onStartLocationSelect,
  onEndLocationSelect,
  onSearchRadiusChange,
  onBatteryPercentageChange,
  onEVModelChange,
  onShowHotelsChange,
  onShowRestaurantsChange,
  onSearch
}) => {
  const hasRouteInfo = routeDistance !== undefined && routeDuration !== undefined;
  const [isBatteryOpen, setIsBatteryOpen] = useState(false);
  
  // Find the selected EV model data
  const selectedModel = indianEVModels.find(model => model.id === selectedEVModel) || indianEVModels[0];
  
  // Calculate remaining range based on battery percentage
  const remainingRange = selectedModel ? Math.round((selectedModel.range * batteryPercentage) / 100) : 0;
  
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
        
        <div>
          <Label htmlFor="ev-model">Electric Car Model</Label>
          <Select value={selectedEVModel} onValueChange={onEVModelChange}>
            <SelectTrigger id="ev-model" className="w-full">
              <SelectValue placeholder="Select an EV model" />
            </SelectTrigger>
            <SelectContent>
              {indianEVModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Popover open={isBatteryOpen} onOpenChange={setIsBatteryOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full flex justify-between">
              <div className="flex items-center">
                <Battery className="h-5 w-5 mr-2" />
                <span>Battery: {batteryPercentage}%</span>
              </div>
              <span className="text-sm text-gray-500">{remainingRange} km left</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Battery Percentage</h4>
              <div className="flex items-center gap-2">
                <Slider
                  value={[batteryPercentage]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(vals) => onBatteryPercentageChange(vals[0])}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-9 text-center">{batteryPercentage}%</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Estimated range: {remainingRange} km
              </div>
              <Button 
                size="sm" 
                onClick={() => setIsBatteryOpen(false)} 
                className="w-full mt-2"
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
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
        
        <div>
          <h3 className="font-medium mb-2">Show on Map</h3>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-hotels" 
                checked={showHotels} 
                onCheckedChange={(checked) => onShowHotelsChange(checked === true)}
              />
              <Label htmlFor="show-hotels" className="flex items-center">
                <Hotel className="h-4 w-4 mr-1" /> Hotels
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-restaurants" 
                checked={showRestaurants} 
                onCheckedChange={(checked) => onShowRestaurantsChange(checked === true)}
              />
              <Label htmlFor="show-restaurants" className="flex items-center">
                <UtensilsCrossed className="h-4 w-4 mr-1" /> Restaurants
              </Label>
            </div>
          </div>
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
          
          {/* Display if route distance is greater than remaining range */}
          {routeDistance / 1000 > remainingRange && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <span className="font-medium text-yellow-800">Range Alert:</span> This route is longer than your estimated remaining range. You'll need to charge along the way.
            </div>
          )}
        </div>
      )}
      
      <div className="mt-auto text-xs text-gray-500 pt-4">
        © {new Date().getFullYear()} EV Route Explorer. Using OpenStreetMap and Geoapify.
      </div>
    </div>
  );
};

export default Sidebar;
