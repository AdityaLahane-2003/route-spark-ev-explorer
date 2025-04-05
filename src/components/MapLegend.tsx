
import React from 'react';

interface MapLegendProps {
  showPOI?: boolean;
}

const MapLegend: React.FC<MapLegendProps> = ({ showPOI = false }) => {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-3 rounded-md shadow-md z-10">
      <h4 className="text-sm font-semibold mb-2">Map Legend</h4>
      <div className="space-y-1 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
          <span>EV Station - Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <span>EV Station - Busy</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
          <span>EV Station - Unavailable</span>
        </div>
        
        {showPOI && (
          <>
            <div className="flex items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
              <span>Hotel</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-violet-600 mr-2"></div>
              <span>Restaurant</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MapLegend;
