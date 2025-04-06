import React from 'react';
import { Circle, ArrowRight, AlertTriangle, Battery, Zap } from 'lucide-react';
import { EVStation, EVModel, calculateDistance } from '@/utils/api';

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
  
  // Create journey calculation with battery projections
  const journeyPlan = calculateJourneyPath(
    evStations,
    selectedEVModel,
    batteryPercentage,
    startLocation,
    endLocation
  );

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
            <div className="flex items-center text-xs text-gray-500">
              <Battery className="h-3.5 w-3.5 mr-1" />
              <span>{batteryPercentage}% • {initialRange} km range</span>
            </div>
          </div>
        </div>
        
        {/* Journey segments */}
        {journeyPlan.map((segment, index) => (
          <React.Fragment key={segment.id || index}>
            {/* Connecting line */}
            <div className={`ml-4 h-6 border-l-2 border-dashed ${segment.isReachable ? 'border-gray-300' : 'border-red-400'}`}></div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${segment.isReachable ? 'bg-green-500' : 'bg-red-500'} text-white mr-3`}>
                {segment.isReachable ? <ArrowRight className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="font-medium">{segment.name}</p>
                  <div className="flex flex-col text-xs space-y-0.5">
                    <p className="text-gray-500">
                      {segment.distanceFromPrevious ? `${(segment.distanceFromPrevious).toFixed(1)} km` : ''}
                      {segment.distanceFromRoute ? ` • ${(segment.distanceFromRoute / 1000).toFixed(1)} km from route` : ''}
                    </p>
                    
                    {!segment.isReachable && (
                      <p className="text-red-500 font-medium flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        Not reachable with current battery
                      </p>
                    )}
                    
                    {segment.arrivalBattery !== undefined && (
                      <p className="text-gray-600">
                        Arrival battery: {segment.arrivalBattery}%
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {segment.chargingTime !== undefined && (
                    <div>
                      <p className="font-medium text-sm">{segment.chargingTime} min</p>
                      <p className="text-xs text-gray-500 flex items-center justify-end">
                        <Zap className="h-3 w-3 mr-1" />
                        Quick charge
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        
        {/* Final connecting line */}
        <div className={`ml-4 h-6 border-l-2 border-dashed ${journeyPlan.length > 0 && journeyPlan[journeyPlan.length - 1].isReachable ? 'border-gray-300' : 'border-red-400'}`}></div>
        
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

// Helper function to calculate journey path with battery projections
interface JourneySegment {
  id?: string;
  name: string;
  distanceFromPrevious?: number;
  distanceFromRoute?: number;
  chargingTime?: number;
  isReachable: boolean;
  arrivalBattery?: number;
  departureCharge?: number;
}

function calculateJourneyPath(
  stations: EVStation[],
  evModel: EVModel,
  startBatteryPercentage: number,
  startLocation: string,
  endLocation: string
): JourneySegment[] {
  if (!stations.length) return [];
  
  const journeyPlan: JourneySegment[] = [];
  let currentBatteryPercentage = startBatteryPercentage;
  let currentPosition = stations[0].location;
  let skipNextStation = false;
  
  // Start from the first station, calculate for each subsequent station
  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    const nextStation = stations[i + 1];
    
    // Calculate distance to this station
    let distanceToCurrent = 0;
    if (i === 0) {
      // For first station, we estimate distance based on route distance
      distanceToCurrent = station.distanceFromRoute ? (station.distanceFromRoute / 1000) + 10 : 15;
    } else {
      // For subsequent stations, calculate from previous station
      distanceToCurrent = calculateDistance(currentPosition, station.location);
    }
    
    // Calculate remaining battery percentage after reaching this station
    const energyUsedPerKm = evModel.batteryCapacity / evModel.range;
    const energyUsed = distanceToCurrent * energyUsedPerKm;
    const percentageUsed = (energyUsed / evModel.batteryCapacity) * 100;
    const arrivalBatteryPercentage = Math.max(0, Math.round(currentBatteryPercentage - percentageUsed));
    
    // Check if station is reachable with current battery
    const isReachable = arrivalBatteryPercentage > 0;
    
    // Get fastest charging connector
    const fastestConnector = station.connectors
      .filter(c => c.available)
      .sort((a, b) => b.power - a.power)[0];
    
    // Calculate charging time needed (to 80% for quick charging)
    const targetCharge = nextStation ? 80 : 50; // Charge less if this is the last station
    const chargingTime = fastestConnector 
      ? Math.max(15, Math.round((evModel.batteryCapacity * (targetCharge - arrivalBatteryPercentage) / 100) / (fastestConnector.power / 60)))
      : 45; // Default 45 min if no connector info
    
    // Add station to journey plan
    journeyPlan.push({
      id: station.id,
      name: station.name,
      distanceFromPrevious: distanceToCurrent,
      distanceFromRoute: station.distanceFromRoute,
      chargingTime: isReachable ? chargingTime : undefined,
      isReachable,
      arrivalBattery: arrivalBatteryPercentage
    });
    
    // Update for next iteration if reachable
    if (isReachable) {
      currentPosition = station.location;
      currentBatteryPercentage = targetCharge; // After charging at this station
    } else {
      // If not reachable, keep same percentage for next calculation
      // This will likely make next station unreachable too
    }
  }
  
  return journeyPlan;
}

export default RouteJourney;
