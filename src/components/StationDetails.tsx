
import React from 'react';
import { EVStation, indianEVModels, calculateChargingTime } from '@/utils/api';
import { X, CheckCircle, CircleX, Clock, Zap, MapPin, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StationDetailsProps {
  station: EVStation;
  selectedEVModel: string;
  batteryPercentage: number;
  onClose: () => void;
}

const StationDetails: React.FC<StationDetailsProps> = ({ 
  station, 
  selectedEVModel, 
  batteryPercentage,
  onClose 
}) => {
  const getStatusIcon = () => {
    if (!station.isAvailable) {
      return <CircleX className="h-5 w-5 text-red-500" />;
    } else if (station.isBusy) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };
  
  const getStatusText = () => {
    if (!station.isAvailable) {
      return "Unavailable";
    } else if (station.isBusy) {
      return "Currently in use";
    } else {
      return "Available";
    }
  };
  
  const getStatusColor = () => {
    if (!station.isAvailable) {
      return "bg-red-50 text-red-800 border-red-200";
    } else if (station.isBusy) {
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    } else {
      return "bg-green-50 text-green-800 border-green-200";
    }
  };
  
  // Find the selected EV model
  const model = indianEVModels.find(m => m.id === selectedEVModel);
  
  const calculateChargeTime = (connector: any, targetPercentage: number = 80) => {
    if (!model) return "N/A";
    
    // Calculate charging time from current battery to target percentage
    const chargingMinutes = calculateChargingTime(
      model.batteryCapacity, 
      batteryPercentage,
      targetPercentage, 
      connector.power
    );
    
    if (chargingMinutes < 60) {
      return `${chargingMinutes} mins`;
    } else {
      const hours = Math.floor(chargingMinutes / 60);
      const mins = chargingMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };
  
  // Calculate how much range would be added with a quick charge to 80%
  const calculateAddedRange = (connector: any) => {
    if (!model) return 0;
    
    // Calculate range added by charging from current to 80%
    const percentageAdded = 80 - batteryPercentage;
    const rangeAdded = (model.range * percentageAdded) / 100;
    return Math.round(rangeAdded);
  };
  
  // Calculate current range and remaining range after charging
  const currentRange = model ? Math.round((model.range * batteryPercentage) / 100) : 0;
  const chargedRange = model ? Math.round((model.range * 80) / 100) : 0;
  
  return (
    <ScrollArea className="h-full max-h-[80vh]">
      <div className="py-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{station.name}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 flex items-start mb-3">
          <MapPin className="h-4 w-4 mr-1 mt-0.5 shrink-0" />
          <span>{station.address}</span>
        </div>
        
        {station.distanceFromRoute && (
          <div className="text-sm mb-3">
            <span className="font-medium">Distance from route:</span> {(station.distanceFromRoute / 1000).toFixed(1)} km
          </div>
        )}
        
        <div className={`flex items-center px-3 py-2 rounded-md border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="ml-2 font-medium">{getStatusText()}</span>
        </div>
        
        {model && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex justify-between items-center">
              <div className="font-medium text-blue-800">Current Range</div>
              <div className="font-semibold">{currentRange} km</div>
            </div>
            <div className="mt-1 h-2 bg-blue-100 rounded-full">
              <div 
                className="h-2 bg-blue-600 rounded-full" 
                style={{ width: `${batteryPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-blue-700 mt-1">Battery: {batteryPercentage}%</div>
          </div>
        )}
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Charging Connectors</h4>
          <div className="space-y-2">
            {station.connectors.map((connector, index) => (
              <div 
                key={index}
                className="border rounded p-3"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium">{connector.type}</div>
                  <div>
                    {connector.available ? (
                      <span className="text-green-500 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Available
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center">
                        <CircleX className="h-4 w-4 mr-1" />
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">{connector.power}kW</div>
                
                {connector.available && model && (
                  <div className="mt-2 pt-2 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>Charge time (to 80%):</span>
                      </div>
                      <span className="font-medium">{calculateChargeTime(connector)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <Battery className="h-3.5 w-3.5 mr-1" />
                        <span>Range added:</span>
                      </div>
                      <span className="font-medium">+{calculateAddedRange(connector)} km</span>
                    </div>
                    
                    <div className="mt-1 bg-green-50 border border-green-200 rounded-md p-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="font-medium text-green-800">After charging</div>
                        <div className="font-semibold">{chargedRange} km range</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {station.isAvailable && (
          <div className="mt-4">
            <Button className="w-full">Navigate to Station</Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default StationDetails;
