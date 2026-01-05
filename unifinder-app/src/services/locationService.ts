// Konum Servisi
// Konum alma ve mesafe hesaplama işlemleri

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends Coordinates {
  city?: string;
  district?: string;
  accuracy?: number;
}

export const locationService = {
  // Konum izni iste
  requestPermission: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  },

  // Mevcut konumu al
  getCurrentLocation: async (): Promise<LocationData | null> => {
    try {
      const hasPermission = await locationService.requestPermission();
      
      if (!hasPermission) {
        console.log('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      };

      // Opsiyonel: Reverse geocoding ile şehir/ilçe bilgisi al
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address) {
          locationData.city = address.city || address.region || undefined;
          locationData.district = address.district || address.subregion || undefined;
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding failed:', geocodeError);
      }

      return locationData;
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  },

  // Kullanıcının konumunu Supabase'e kaydet
  saveUserLocation: async (userId: string, location: Coordinates): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          // location_updated_at kolonu profiles tablosunda yok, updated_at otomatik güncellenir
        })
        .eq('id', userId);

      if (error) {
        console.error('Save location error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Save location failed:', error);
      return false;
    }
  },

  // İki nokta arasındaki mesafeyi hesapla (Haversine formülü)
  calculateDistance: (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = locationService.toRadians(coord2.latitude - coord1.latitude);
    const dLon = locationService.toRadians(coord2.longitude - coord1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(locationService.toRadians(coord1.latitude)) *
      Math.cos(locationService.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // 1 ondalık basamak
  },

  // Derece -> Radyan dönüşümü
  toRadians: (degrees: number): number => {
    return degrees * (Math.PI / 180);
  },

  // Mesafeyi formatla (kullanıcı dostu)
  formatDistance: (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    } else if (km < 10) {
      return `${km.toFixed(1)} km`;
    } else {
      return `${Math.round(km)} km`;
    }
  },

  // Belirli mesafe içindeki profilleri getir (Supabase RPC ile)
  getNearbyProfiles: async (
    userId: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<any[]> => {
    try {
      // Supabase'de RPC fonksiyonu kullanarak yakındaki profilleri al
      const { data, error } = await supabase.rpc('get_nearby_profiles', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radiusKm,
        user_id: userId,
        result_limit: limit,
      });

      if (error) {
        console.error('Get nearby profiles error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get nearby profiles failed:', error);
      return [];
    }
  },

  // Konum izni durumunu kontrol et
  checkPermissionStatus: async (): Promise<'granted' | 'denied' | 'undetermined'> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status as 'granted' | 'denied' | 'undetermined';
    } catch (error) {
      return 'undetermined';
    }
  },

  // Konum servislerinin açık olup olmadığını kontrol et
  isLocationServicesEnabled: async (): Promise<boolean> => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      return false;
    }
  },
};

export default locationService;
