// MapWrapper - Platform-specific Map component
import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Only import MapView on native platforms AND not in Expo Go
let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    console.log('react-native-maps not available');
  }
}

interface MapWrapperProps {
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete?: (region: any) => void;
  onPress?: (e: any) => void;
  markerCoordinate?: {
    latitude: number;
    longitude: number;
  } | null;
  markerTitle?: string;
  colors: any;
  interactive?: boolean;
}

export const MapWrapper: React.FC<MapWrapperProps> = ({
  style,
  region,
  onRegionChangeComplete,
  onPress,
  markerCoordinate,
  markerTitle,
  colors,
  interactive = true,
}) => {
  // Fallback for Web or Expo Go (where native maps are not available)
  if (Platform.OS === 'web' || isExpoGo || !MapView) {
    const handleOpenMaps = () => {
      if (markerCoordinate) {
        const url = `https://www.google.com/maps/search/?api=1&query=${markerCoordinate.latitude},${markerCoordinate.longitude}`;
        Linking.openURL(url);
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.webPlaceholder, style, { backgroundColor: colors.surface }]}
        onPress={markerCoordinate ? handleOpenMaps : undefined}
        activeOpacity={markerCoordinate ? 0.7 : 1}
      >
        <MaterialIcons name="map" size={48} color={colors.primary} />
        <Text style={[styles.webText, { color: colors.textSecondary }]}>
          {isExpoGo 
            ? 'Harita Expo Go\'da desteklenmiyor' 
            : markerCoordinate 
              ? 'Haritada görüntülemek için tıklayın' 
              : 'Harita mobilde kullanılabilir'}
        </Text>
        {markerCoordinate && (
          <View style={[styles.coordinateBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.coordinateText, { color: colors.textTertiary }]}>
              📍 {markerCoordinate.latitude.toFixed(4)}, {markerCoordinate.longitude.toFixed(4)}
            </Text>
          </View>
        )}
        {isExpoGo && (
          <Text style={[styles.expoGoHint, { color: colors.textTertiary }]}>
            Development build ile harita kullanılabilir
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Native platforms with development build - use actual MapView
  return (
    <MapView
      style={style}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={onPress}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      pitchEnabled={interactive}
      rotateEnabled={interactive}
    >
      {markerCoordinate && Marker && (
        <Marker
          coordinate={markerCoordinate}
          title={markerTitle || 'Konum'}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  webPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  webText: {
    fontSize: 14,
    textAlign: 'center',
  },
  coordinateBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  coordinateText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  expoGoHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default MapWrapper;
