
import React from 'react';
import { Circle, ArrowRight } from 'lucide-react';
import { EVStation, EVModel } from '@/utils/api';

interface RouteJourneyProps {
  startLocation: string;
  endLocation: string;
  evStations: EVStation[];
  selectedEVModel: EVModel;
  batteryPercentage: number;
}

const RouteJourney: React.FC<RouteJourneyProps> = ({
  startLocation,
  endLocation,
  evStations,
  selectedEVModel,
  batteryPercentage
}) => {
  if (!evStations.length) {
    return null;
  }
  
  // Calculate remaining range based on battery percentage
  const initialRange = Math.round((selectedEVModel.range * batteryPercentage) / 100);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Journey Plan</h3>
      
      <div className="space-y-1">
        {/* Starting point */}
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-white mr-3">
            <Circle className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{startLocation}</p>
            <p className="text-xs text-gray-500">Starting point • {initialRange} km range</p>
          </div>
        </div>
        
        {/* Connecting line */}
        <div className="ml-4 h-6 border-l-2 border-dashed border-gray-300"></div>
        
        {/* EV Stations along the route */}
        {evStations.map((station, index) => {
          const stationChargingTime = station.connectors.length > 0 
            ? Math.round((selectedEVModel.batteryCapacity * 0.8) / (station.connectors[0].power / 60)) 
            : 45; // Default 45 min if no connector info
            
          return (
            <React.Fragment key={station.id}>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white mr-3">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <p className="font-medium">{station.name}</p>
                    <p className="text-xs text-gray-500">
                      {station.distanceFromRoute ? `${(station.distanceFromRoute / 1000).toFixed(1)} km from route` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{stationChargingTime} min charge</p>
                  </div>
                </div>
              </div>
              <div className="ml-4 h-6 border-l-2 border-dashed border-gray-300"></div>
            </React.Fragment>
          );
        })}
        
        {/* Destination */}
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 bg-white mr-3">
            <Circle className="h-4 w-4 fill-current text-gray-400" />
          </div>
          <div>
            <p className="font-medium">{endLocation}</p>
            <p className="text-xs text-gray-500">Destination</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteJourney;
