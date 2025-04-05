
import React from 'react';
import { POI } from '@/utils/api';
import { X, Star, MapPin, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface POIDetailsProps {
  poi: POI;
  onClose: () => void;
}

const POIDetails: React.FC<POIDetailsProps> = ({ poi, onClose }) => {
  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{poi.name}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        <div className="flex items-center mb-1">
          <MapPin className="h-4 w-4 mr-1" />
          {poi.address}
        </div>
        {poi.distanceFromRoute && (
          <div className="flex items-center">
            <Flag className="h-4 w-4 mr-1" />
            <span>{poi.distanceFromRoute} meters from route</span>
          </div>
        )}
      </div>
      
      {poi.rating && (
        <div className="flex items-center mb-4">
          <Star className={`h-4 w-4 ${poi.rating >= 4 ? 'text-yellow-500' : 'text-gray-400'} mr-1`} fill="currentColor" />
          <span className="font-medium">{poi.rating}</span>
          <span className="text-gray-500 text-sm">/5</span>
        </div>
      )}
      
      {poi.type === 'hotel' && (
        <div className="border-t pt-2 mt-2">
          <h4 className="font-medium mb-2">Amenities</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Free WiFi</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Parking</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>EV Charging</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Restaurant</span>
            </div>
          </div>
        </div>
      )}
      
      {poi.type === 'restaurant' && (
        <div className="border-t pt-2 mt-2">
          <h4 className="font-medium mb-2">Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Dine-in</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Takeout</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <Button className="w-full">
          {poi.type === 'hotel' ? 'View Booking Options' : 'View Menu'}
        </Button>
      </div>
    </div>
  );
};

export default POIDetails;
