
import React from 'react';
import { EVStation } from '@/utils/api';
import { X, CheckCircle, CircleX, Clock } from 'lucide-react';

interface StationDetailsProps {
  station: EVStation;
  onClose: () => void;
}

const StationDetails: React.FC<StationDetailsProps> = ({ station, onClose }) => {
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
  
  return (
    <div className="py-2">
      <div className="text-sm text-gray-600">{station.address}</div>
      
      <div className={`flex items-center mt-4 px-3 py-2 rounded-md border ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="ml-2 font-medium">{getStatusText()}</span>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Charging Connectors</h4>
        <div className="space-y-2">
          {station.connectors.map((connector, index) => (
            <div 
              key={index}
              className="border rounded p-3 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{connector.type}</div>
                <div className="text-sm text-gray-600">{connector.power}kW</div>
              </div>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default StationDetails;
