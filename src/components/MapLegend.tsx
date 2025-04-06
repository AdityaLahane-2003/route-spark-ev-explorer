
import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';

interface MapLegendProps {
  showPOI?: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ showPOI = false }) => {
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
        <div className="flex items-center">
          <div className="flex items-center h-3 mr-2">
            <AlertTriangle className="w-3 h-3 text-red-500" />
          </div>
          <span>Station not reachable</span>
        </div>
        
        {/* Journey plan indicators */}
        <div className="mt-1 pt-1 border-t border-gray-200">
          <div className="flex items-center mb-1">
            <div className="flex items-center h-3 mr-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
            </div>
            <span>Required charging stop</span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center h-3 mr-2">
              <ArrowRight className="w-3 h-3 text-blue-500" />
            </div>
            <span>Can skip this stop</span>
          </div>
        </div>
        
        {showPOI && (
          <>
            <div className="mt-1 pt-1 border-t border-gray-200">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                <span>Hotel</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-violet-600 mr-2"></div>
                <span>Restaurant</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MapLegend;
