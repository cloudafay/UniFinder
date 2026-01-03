// Konum Context
// Konum yönetimi için global state

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import locationService, { LocationData, Coordinates } from '../services/locationService';

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  error: string | null;
  discoveryRadius: number;
  setDiscoveryRadius: (radius: number) => void;
  requestLocation: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  calculateDistanceTo: (coords: Coordinates) => number | null;
  formatDistanceTo: (coords: Coordinates) => string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

// Varsayılan keşif mesafesi (kilometre)
const DEFAULT_DISCOVERY_RADIUS = 10;

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [error, setError] = useState<string | null>(null);
  const [discoveryRadius, setDiscoveryRadius] = useState(DEFAULT_DISCOVERY_RADIUS);

  // İzin durumunu kontrol et
  const checkPermission = useCallback(async () => {
    const status = await locationService.checkPermissionStatus();
    setPermissionStatus(status);
    return status;
  }, []);

  // Konum iste ve kaydet
  const requestLocation = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Konum servisleri açık mı?
      const servicesEnabled = await locationService.isLocationServicesEnabled();
      if (!servicesEnabled) {
        setError('Konum servisleri kapalı. Lütfen ayarlardan açın.');
        Alert.alert(
          'Konum Servisleri Kapalı',
          'Yakındaki kullanıcıları görmek için konum servislerini açmanız gerekiyor.',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      // Konum al
      const locationData = await locationService.getCurrentLocation();
      
      if (!locationData) {
        const status = await checkPermission();
        if (status === 'denied') {
          setError('Konum izni reddedildi.');
          Alert.alert(
            'Konum İzni Gerekli',
            'Yakındaki kullanıcıları görmek için konum iznine ihtiyacımız var.',
            [
              { text: 'İptal', style: 'cancel' },
              { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
            ]
          );
        }
        return false;
      }

      setLocation(locationData);
      setPermissionStatus('granted');

      // Supabase'e kaydet
      if (user?.id) {
        await locationService.saveUserLocation(user.id, {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });
      }

      return true;
    } catch (err) {
      console.error('Request location error:', err);
      setError('Konum alınamadı.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, checkPermission]);

  // Konumu yenile
  const refreshLocation = useCallback(async () => {
    if (permissionStatus === 'granted') {
      await requestLocation();
    }
  }, [permissionStatus, requestLocation]);

  // Başka bir konuma olan mesafeyi hesapla
  const calculateDistanceTo = useCallback((coords: Coordinates): number | null => {
    if (!location) return null;
    return locationService.calculateDistance(location, coords);
  }, [location]);

  // Mesafeyi formatla
  const formatDistanceTo = useCallback((coords: Coordinates): string | null => {
    const distance = calculateDistanceTo(coords);
    if (distance === null) return null;
    return locationService.formatDistance(distance);
  }, [calculateDistanceTo]);

  // Uygulama açıldığında izin durumunu kontrol et
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // User değiştiğinde konumu güncelle (izin varsa)
  useEffect(() => {
    if (user && permissionStatus === 'granted') {
      requestLocation();
    }
  }, [user?.id]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        permissionStatus,
        error,
        discoveryRadius,
        setDiscoveryRadius,
        requestLocation,
        refreshLocation,
        calculateDistanceTo,
        formatDistanceTo,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export default LocationContext;
