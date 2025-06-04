import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * GooglePlacesAutocomplete Component
 * Provides Google Places autocomplete functionality for address inputs
 */
const GooglePlacesAutocomplete = ({ 
  value = '', 
  onChange, 
  placeholder = 'Enter address...', 
  className = '',
  disabled = false,
  onPlaceSelect = null // Optional callback when a place is selected
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Get API key from environment
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  /**
   * Load Google Places API script
   */
  const loadGooglePlacesScript = () => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Places API already loaded');
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('🔄 Google Places API script already exists, waiting...');
        // Wait for it to load
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded);
          reject(new Error('Google Places API loading timeout'));
        }, 10000);
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('✅ Google Places API script loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        console.error('❌ Failed to load Google Places API script:', error);
        reject(new Error('Failed to load Google Places API'));
      };

      document.head.appendChild(script);
      console.log('🚀 Loading Google Places API script...');
    });
  };

  /**
   * Initialize Google Places Autocomplete
   */
  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      console.error('❌ Cannot initialize autocomplete: missing dependencies');
      return;
    }

    try {
      console.log('🔧 Initializing Google Places Autocomplete...');
      
      // Create autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'], // Allow both businesses and addresses
        fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types'],
        componentRestrictions: { country: 'in' } // Restrict to India, change as needed
      });

      autocompleteRef.current = autocomplete;

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.formatted_address) {
          console.warn('⚠️ No address found for selected place');
          return;
        }

        console.log('✅ Place selected:', {
          address: place.formatted_address,
          name: place.name,
          types: place.types
        });

        // Update the input value
        if (onChange) {
          onChange(place.formatted_address);
        }

        // Call optional callback with full place data
        if (onPlaceSelect) {
          onPlaceSelect({
            address: place.formatted_address,
            name: place.name,
            placeId: place.place_id,
            geometry: place.geometry,
            types: place.types
          });
        }
      });

      console.log('✅ Google Places Autocomplete initialized successfully');
      setIsLoaded(true);
      setError(null);

    } catch (initError) {
      console.error('❌ Error initializing autocomplete:', initError);
      setError('Failed to initialize address autocomplete');
    }
  };

  /**
   * Initialize the component
   */
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      // Check if API key exists
      if (!apiKey) {
        const errorMsg = 'Google Maps API key not found. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file';
        console.error('❌', errorMsg);
        setError(errorMsg);
        return;
      }

      // Prevent multiple initializations
      if (isInitializing) {
        console.log('🔄 Already initializing, skipping...');
        return;
      }

      try {
        setIsInitializing(true);
        setError(null);

        console.log('🚀 Starting Google Places initialization...');
        console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');

        // Load the Google Places API
        await loadGooglePlacesScript();

        // Check if component is still mounted
        if (!isMounted) {
          console.log('Component unmounted, aborting initialization');
          return;
        }

        // Wait a bit for the API to be fully ready
        setTimeout(() => {
          if (isMounted && inputRef.current) {
            initializeAutocomplete();
          }
        }, 100);

      } catch (loadError) {
        console.error('❌ Error loading Google Places API:', loadError);
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initialize();

    // Cleanup function
    return () => {
      isMounted = false;
      if (autocompleteRef.current) {
        // Clean up Google Places listeners
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  /**
   * Handle manual input changes (typing)
   */
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  /**
   * Handle input focus
   */
  const handleFocus = () => {
    // Trigger Google Places dropdown on focus
    if (autocompleteRef.current && window.google) {
      // This will show predictions even for empty input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 0);
    }
  };

  return (
    <div className="google-places-autocomplete-container relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={isInitializing ? 'Loading autocomplete...' : placeholder}
        className={`${className} ${isInitializing ? 'opacity-75' : ''}`}
        disabled={disabled || isInitializing}
        autoComplete="off"
      />
      
      {/* Loading indicator */}
      {isInitializing && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-500 text-xs mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded border">
          <strong>Autocomplete Error:</strong> {error}
        </div>
      )}

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1">
          Status: {isInitializing ? 'Initializing...' : isLoaded ? 'Ready' : 'Not loaded'}
          {apiKey && ` | API Key: ${apiKey.substring(0, 8)}...`}
        </div>
      )}
    </div>
  );
};

GooglePlacesAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onPlaceSelect: PropTypes.func
};

export default GooglePlacesAutocomplete;