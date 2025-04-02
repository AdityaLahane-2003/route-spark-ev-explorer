
import React from 'react';
import { CheckCircle, CircleX, Clock } from 'lucide-react';

const MapLegend = () => {
  return (
    <div className="absolute bottom-5 right-5 z-10 bg-white p-3 rounded-md shadow-md">
      <div className="text-sm font-medium mb-2">EV Station Status</div>
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="w-5 h-5 mr-2">
            <img 
              src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" 
              alt="Available" 
              className="h-full"
            />
          </div>
          <span className="text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Available
          </span>
        </div>
        
        <div className="flex items-center">
          <div className="w-5 h-5 mr-2">
            <img 
              src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png" 
              alt="In Use" 
              className="h-full"
            />
          </div>
          <span className="text-sm flex items-center">
            <Clock className="h-4 w-4 mr-1 text-yellow-500" />
            In Use
          </span>
        </div>
        
        <div className="flex items-center">
          <div className="w-5 h-5 mr-2">
            <img 
              src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" 
              alt="Unavailable" 
              className="h-full"
            />
          </div>
          <span className="text-sm flex items-center">
            <CircleX className="h-4 w-4 mr-1 text-red-500" />
            Unavailable
          </span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
