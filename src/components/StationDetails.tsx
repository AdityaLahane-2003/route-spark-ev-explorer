
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
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{station.name}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="text-sm text-gray-600 mt-1">{station.address}</div>
      
      <div className="flex items-center mt-3">
        {getStatusIcon()}
        <span className="ml-2">{getStatusText()}</span>
      </div>
      
      <div className="mt-4">
        <h4 className="font-medium mb-2">Connectors</h4>
        <div className="space-y-2">
          {station.connectors.map((connector, index) => (
            <div 
              key={index}
              className="border rounded p-2 flex justify-between items-center"
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
