
import React from 'react';
import { Circle, ArrowRight, AlertTriangle, Battery, Zap, CheckCircle } from 'lucide-react';
import { EVStation, EVModel, calculateDistance } from '@/utils/api';
import { ScrollArea } from './ui/scroll-area';

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
  
  // Create journey calculation with battery projections and optimal stops
  const journeyPlan = calculateOptimalJourneyPath(
    evStations,
    selectedEVModel,
    batteryPercentage,
    startLocation,
    endLocation
  );

  return (
    <div className="bg-white rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Journey Plan</h3>
      
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
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${segment.status === 'required' ? 'bg-green-500' : segment.status === 'optional' ? 'bg-blue-500' : 'bg-red-500'} text-white mr-3`}>
                {segment.status === 'required' ? <CheckCircle className="h-4 w-4" /> : 
                 segment.status === 'optional' ? <ArrowRight className="h-4 w-4" /> : 
                 <AlertTriangle className="h-4 w-4" />}
              </div>
              <div className="flex-1 flex justify-between items-start">
                <div>
                  <p className="font-medium">{segment.name}</p>
                  <div className="flex flex-col text-xs space-y-0.5">
                    <p className="text-gray-500">
                      {segment.distanceFromPrevious ? `${(segment.distanceFromPrevious).toFixed(1)} km` : ''}
                      {segment.distanceFromRoute ? ` • ${(segment.distanceFromRoute / 1000).toFixed(1)} km from route` : ''}
                    </p>
                    
                    {segment.status === 'unreachable' && (
                      <p className="text-red-500 font-medium flex items-center">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        Not reachable with current battery
                      </p>
                    )}
                    
                    {segment.status === 'optional' && (
                      <p className="text-blue-500 font-medium">
                        Optional stop - can skip
                      </p>
                    )}
                    
                    {segment.arrivalBattery !== undefined && (
                      <p className="text-gray-600">
                        Arrival battery: {segment.arrivalBattery}%
                      </p>
                    )}

                    {segment.departureCharge !== undefined && (
                      <p className="text-gray-600">
                        After charging: {segment.departureCharge}%
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {segment.chargingTime !== undefined && (
                    <div>
                      <p className="font-medium text-sm">{segment.chargingTime < 60 ? `${segment.chargingTime} min` : `${Math.floor(segment.chargingTime / 60)}h ${segment.chargingTime % 60}m`}</p>
                      <p className="text-xs text-gray-500 flex items-center justify-end">
                        <Zap className="h-3 w-3 mr-1" />
                        {segment.status === 'required' ? 'Required charge' : 'Quick charge'}
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
            {journeyPlan.length > 0 && journeyPlan[journeyPlan.length - 1].finalBattery !== undefined && (
              <p className="text-xs text-gray-600">
                Estimated arrival battery: {journeyPlan[journeyPlan.length - 1].finalBattery}%
              </p>
            )}
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
  finalBattery?: number;
  status: 'required' | 'optional' | 'unreachable';
}

function calculateOptimalJourneyPath(
  stations: EVStation[],
  evModel: EVModel,
  startBatteryPercentage: number,
  startLocation: string,
  endLocation: string
): JourneySegment[] {
  if (!stations.length) return [];
  
  // Sort stations by their route sequence (distance from start)
  const sortedStations = [...stations].sort((a, b) => {
    const aDistance = a.distanceFromStart || 0;
    const bDistance = b.distanceFromStart || 0;
    return aDistance - bDistance;
  });
  
  const journeyPlan: JourneySegment[] = [];
  let currentBatteryPercentage = startBatteryPercentage;
  let currentPosition = sortedStations[0].location;
  let previousPosition = null;
  let totalDistanceFromStart = 0;
  
  // Full charge value - for most EVs we target 80% for fast charging
  const targetFastCharge = 80;
  const fullCharge = 100;
  const minimumSafeBattery = 10; // Don't let battery go below this percentage
  
  // Process each station to determine if it's required, optional, or unreachable
  for (let i = 0; i < sortedStations.length; i++) {
    const station = sortedStations[i];
    const isLastStation = i === sortedStations.length - 1;
    const nextStation = i < sortedStations.length - 1 ? sortedStations[i + 1] : null;
    
    // For first station, estimate distance from start location
    let distanceToStation = 0;
    if (previousPosition) {
      distanceToStation = calculateDistance(previousPosition, station.location);
    } else {
      // Estimate distance to first station if distanceFromStart is available
      distanceToStation = station.distanceFromStart ? station.distanceFromStart / 1000 : 10;
    }
    
    // Calculate energy consumption to reach this station
    const energyUsedPerKm = evModel.batteryCapacity / evModel.range;
    const energyUsed = distanceToStation * energyUsedPerKm;
    const percentageUsed = (energyUsed / evModel.batteryCapacity) * 100;
    const arrivalBatteryPercentage = Math.max(0, Math.round(currentBatteryPercentage - percentageUsed));
    
    // Calculate distance to the next station (if any)
    let distanceToNextStation = 0;
    if (nextStation) {
      if (station.distanceFromStart !== undefined && nextStation.distanceFromStart !== undefined) {
        distanceToNextStation = (nextStation.distanceFromStart - station.distanceFromStart) / 1000;
      } else {
        distanceToNextStation = calculateDistance(station.location, nextStation.location);
      }
    } else {
      // If no next station, use distance to destination (estimate)
      distanceToNextStation = 20; // Default if we can't calculate
      
      // If we have route info, we can estimate based on total route length
      if (station.distanceFromStart !== undefined) {
        const distanceFromStationToEnd = (50 - station.distanceFromStart) / 1000;
        if (distanceFromStationToEnd > 0) {
          distanceToNextStation = distanceFromStationToEnd;
        }
      }
    }
    
    // Calculate energy needed to reach the next station
    const energyForNextSegment = distanceToNextStation * energyUsedPerKm;
    const percentageForNextSegment = (energyForNextSegment / evModel.batteryCapacity) * 100;
    
    // Determine if this station is reachable
    const isReachable = arrivalBatteryPercentage > 0;
    
    // Determine if charging at this station is required to reach the next one
    // We need enough battery to reach next station plus safety margin
    const canReachNextWithoutCharging = arrivalBatteryPercentage > (percentageForNextSegment + minimumSafeBattery);
    
    // Determine status of this station
    let stationStatus: 'required' | 'optional' | 'unreachable';
    let departureCharge = arrivalBatteryPercentage;
    let chargingTime;
    
    if (!isReachable) {
      stationStatus = 'unreachable';
    } else if (canReachNextWithoutCharging && !isLastStation) {
      stationStatus = 'optional';
    } else {
      stationStatus = 'required';
      
      // Calculate required charging
      // Get fastest available connector
      const fastestConnector = station.connectors
        .filter(c => c.available)
        .sort((a, b) => b.power - a.power)[0];
      
      if (fastestConnector) {
        // How much do we need to charge?
        const minimumChargeNeeded = percentageForNextSegment + minimumSafeBattery;
        const targetCharge = Math.min(
          // Either fast charge target or just enough to reach next station plus safety
          isLastStation ? targetFastCharge : Math.max(targetFastCharge, arrivalBatteryPercentage + minimumChargeNeeded),
          fullCharge
        );
        
        // Calculate charging time (minutes)
        const chargingPercentage = targetCharge - arrivalBatteryPercentage;
        chargingTime = Math.max(10, Math.round((evModel.batteryCapacity * chargingPercentage / 100) / (fastestConnector.power / 60)));
        
        departureCharge = targetCharge;
      } else {
        // No connector info, use default
        chargingTime = 30;
        departureCharge = Math.min(arrivalBatteryPercentage + 30, fullCharge);
      }
    }
    
    // Calculate final battery percentage after this leg of journey
    const finalBattery = isLastStation ? 
      arrivalBatteryPercentage - percentageForNextSegment :
      undefined;
    
    // Add station to journey plan
    journeyPlan.push({
      id: station.id,
      name: station.name,
      distanceFromPrevious: distanceToStation,
      distanceFromRoute: station.distanceFromRoute,
      chargingTime: stationStatus === 'required' ? chargingTime : undefined,
      isReachable,
      arrivalBattery: arrivalBatteryPercentage,
      departureCharge: stationStatus === 'required' ? departureCharge : undefined,
      finalBattery: finalBattery > 0 ? Math.round(finalBattery) : undefined,
      status: stationStatus
    });
    
    // Update for next iteration if we can reach this station
    if (isReachable) {
      previousPosition = station.location;
      currentBatteryPercentage = stationStatus === 'required' ? departureCharge : arrivalBatteryPercentage;
    }
    
    // If we can't reach this station, subsequent stations will use the same battery percentage
    // which will likely make them unreachable too
  }
  
  return journeyPlan;
}

export default RouteJourney;
