// components/LocationSelector.js
import React, { useState, useEffect, useRef } from 'react';
import LocationPicker from './LocationPicker';
import { MdMyLocation, MdSearch, MdPlace, MdClear, MdCheck, MdEdit, MdExpandMore, MdExpandLess } from 'react-icons/md';

const LocationSelector = ({ 
  onLocationSelect, 
  initialLocation = null,
  label = "Select Location",
  required = false,
  error = null
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(false); // Start with map hidden
  const [isConfirmed, setIsConfirmed] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Nepal bounding box coordinates
  const nepalBounds = {
    north: 30.5,
    south: 26.0,
    east: 88.5,
    west: 80.0
  };

  // Convert to Leaflet format if initialLocation exists
  useEffect(() => {
    if (initialLocation && initialLocation.coordinates) {
      setSelectedLocation({
        lat: initialLocation.coordinates[1],
        lng: initialLocation.coordinates[0]
      });
      setIsConfirmed(true);
      setShowMap(false);
    } else if (initialLocation && initialLocation.lat) {
      setSelectedLocation(initialLocation);
      setIsConfirmed(true);
      setShowMap(false);
    }
  }, [initialLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch location suggestions limited to Nepal
  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=np&limit=6&addressdetails=1&bounded=1&viewbox=${nepalBounds.west},${nepalBounds.north},${nepalBounds.east},${nepalBounds.south}`
      );
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Filter results to ensure they're within Nepal bounds
        const nepalResults = data.filter(item => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          return lat >= nepalBounds.south && lat <= nepalBounds.north && 
                 lon >= nepalBounds.west && lon <= nepalBounds.east;
        });
        setSuggestions(nepalResults);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchSuggestions(searchQuery);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    setIsConfirmed(false);
    setShowMap(true); // Show map when location is selected
    
    // Reverse geocoding to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
        setSearchQuery(data.display_name);
        
        // Pass complete location data to parent
        onLocationSelect({
          coordinates: [location.lng, location.lat],
          latitude: location.lat,
          longitude: location.lng,
          address: data.display_name,
          addressDetails: data.address
        });
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress('Address lookup failed');
      
      onLocationSelect({
        coordinates: [location.lng, location.lat],
        latitude: location.lat,
        longitude: location.lng,
        address: ''
      });
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };
    
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setShowMap(true); // Show map when suggestion is selected
    handleLocationSelect(location);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=np&limit=1&addressdetails=1&bounded=1&viewbox=${nepalBounds.west},${nepalBounds.north},${nepalBounds.east},${nepalBounds.south}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setShowMap(true); // Show map when search is performed
        handleLocationSelect(location);
      } else {
        setError('Location not found in Nepal. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setError('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Check if location is within Nepal
          if (location.lat >= nepalBounds.south && location.lat <= nepalBounds.north && 
              location.lng >= nepalBounds.west && location.lng <= nepalBounds.east) {
            setShowMap(true); // Show map when current location is used
            handleLocationSelect(location);
          } else {
            alert('Your current location is outside Nepal. Please select a location within Nepal.');
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('Unable to get your current location. Please allow location access or select manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedLocation(null);
    setAddress('');
    setIsConfirmed(false);
    setShowMap(false);
    onLocationSelect(null);
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      setIsConfirmed(true);
      setShowMap(false);
      setShowSuggestions(false);
    }
  };

  const editLocation = () => {
    setIsConfirmed(false);
    setShowMap(true);
  };

  const toggleMap = () => {
    setShowMap(!showMap);
    if (showMap) {
      setShowSuggestions(false);
    }
  };

  const formatSuggestion = (suggestion) => {
    const { address } = suggestion;
    if (!address) return suggestion.display_name;

    // Create a clean, readable address
    const parts = [];
    if (address.road) parts.push(address.road);
    if (address.neighbourhood) parts.push(address.neighbourhood);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.town) parts.push(address.town);
    if (address.village) parts.push(address.village);
    if (address.municipality) parts.push(address.municipality);

    return parts.length > 0 ? parts.join(', ') : suggestion.display_name;
  };

  const getLocationType = (suggestion) => {
    const { address } = suggestion;
    if (address.amenity) return `${address.amenity}`;
    if (address.road) return 'Road';
    if (address.neighbourhood) return 'Area';
    if (address.suburb) return 'Suburb';
    if (address.city) return 'City';
    if (address.town) return 'Town';
    if (address.village) return 'Village';
    return 'Location';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          
          <div className="flex gap-2">
            {!isConfirmed && selectedLocation && (
              <button
                type="button"
                onClick={confirmLocation}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <MdCheck className="h-4 w-4" />
                Confirm
              </button>
            )}
            {isConfirmed && (
              <button
                type="button"
                onClick={editLocation}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <MdEdit className="h-4 w-4" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={getCurrentLocation}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <MdMyLocation className="h-4 w-4" />
              My Location
            </button>
          </div>
        </div>

        {/* Search Bar with Autocomplete - Always on top */}
        <div className="mb-4 relative" ref={suggestionsRef}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search locations in Nepal (type 2+ characters)..."
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <MdClear className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Suggestions Dropdown - High z-index to appear above everything */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.place_id}-${index}`}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    <MdPlace className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {formatSuggestion(suggestion)}
                        </p>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                          {getLocationType(suggestion)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {searchQuery && showSuggestions && suggestions.length === 0 && isSearching && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                Searching Nepal for "{searchQuery}"...
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && showSuggestions && suggestions.length === 0 && !isSearching && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              <div className="px-4 py-3 text-sm text-gray-500">
                No locations found for "{searchQuery}" in Nepal
              </div>
            </div>
          )}
        </div>

        {/* Map Toggle Button */}
        {!isConfirmed && (
          <div className="mb-4">
            <button
              type="button"
              onClick={toggleMap}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {showMap ? 'Hide Map' : 'Show Map to Select Location'}
              </span>
              {showMap ? (
                <MdExpandLess className="h-5 w-5 text-gray-500" />
              ) : (
                <MdExpandMore className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        )}

        {/* Map Section - Shows only when toggled */}
        {showMap && !isConfirmed && (
          <div className="mb-4 rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-purple-50 px-4 py-2 border-b border-purple-200">
              <p className="text-sm text-purple-700 font-medium">
                📍 Click anywhere on the map to select location (Nepal only)
              </p>
            </div>
            <LocationPicker 
              onLocationSelect={handleLocationSelect}
              initialPosition={selectedLocation}
              height="300px"
              bounds={nepalBounds}
            />
          </div>
        )}

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className={`rounded-lg p-4 border ${
            isConfirmed 
              ? 'bg-green-50 border-green-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <MdPlace className={`h-5 w-5 mt-0.5 ${
                isConfirmed ? 'text-green-600' : 'text-blue-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${
                    isConfirmed ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {isConfirmed ? '✅ Location Confirmed' : '📍 Location Selected'}
                  </h4>
                  {isConfirmed && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Confirmed
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {address && (
                    <div>
                      <span className="font-medium text-gray-700">Address: </span>
                      <p className="mt-1 text-gray-900">{address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium">Latitude:</span> 
                      <br />
                      {selectedLocation.lat.toFixed(6)}
                    </div>
                    <div>
                      <span className="font-medium">Longitude:</span>
                      <br />
                      {selectedLocation.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
                {!isConfirmed && (
                  <p className="text-xs text-blue-600 mt-3 font-medium">
                    Click "Confirm" above to lock this location, or click on map to change
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step-by-step Instructions */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">How to select location:</h5>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">1</div>
              <span><strong>Search</strong> - Type address or place name</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</div>
              <span><strong>Select</strong> - Choose from suggestions or click on map</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">3</div>
              <span><strong>Confirm</strong> - Click "Confirm" to finalize location</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;