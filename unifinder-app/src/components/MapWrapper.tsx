// MapWrapper - Expo Go uyumlu WebView tabanlı harita
// react-native-maps yerine WebView kullanarak Expo Go'da da çalışır
import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

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
  const webViewRef = useRef<WebView>(null);

  // Default region (Türkiye merkezi)
  const defaultRegion = {
    latitude: 39.9334,
    longitude: 32.8597,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const currentRegion = region || defaultRegion;
  const marker = markerCoordinate || null;

  // Leaflet/OpenStreetMap tabanlı harita HTML'i (ücretsiz, API key gerektirmez)
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { 
      width: 100%; 
      height: 100%; 
      background: ${colors?.surface || '#1a1a2e'};
    }
    .leaflet-control-attribution { display: none; }
    .custom-marker {
      background: ${colors?.primary || '#8B5CF6'};
      border: 3px solid white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: ${interactive},
      dragging: ${interactive},
      touchZoom: ${interactive},
      scrollWheelZoom: ${interactive},
      doubleClickZoom: ${interactive},
    }).setView([${currentRegion.latitude}, ${currentRegion.longitude}], 15);

    // Dark mode uyumlu tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Marker varsa ekle
    ${marker ? `
      const customIcon = L.divIcon({
        className: 'custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      
      const marker = L.marker([${marker.latitude}, ${marker.longitude}], { 
        icon: customIcon 
      }).addTo(map);
      
      ${markerTitle ? `marker.bindPopup('${markerTitle}');` : ''}
    ` : ''}

    // Haritaya tıklama
    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        coordinate: {
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }
      }));
    });

    // Harita hareket ettiğinde
    map.on('moveend', function() {
      const center = map.getCenter();
      const bounds = map.getBounds();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'regionChange',
        region: {
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: bounds.getNorth() - bounds.getSouth(),
          longitudeDelta: bounds.getEast() - bounds.getWest()
        }
      }));
    });

    // Marker'ı güncellemek için fonksiyon
    window.updateMarker = function(lat, lng, title) {
      if (window.currentMarker) {
        map.removeLayer(window.currentMarker);
      }
      const customIcon = L.divIcon({
        className: 'custom-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      window.currentMarker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      if (title) {
        window.currentMarker.bindPopup(title).openPopup();
      }
      map.setView([lat, lng], 15);
    };
  </script>
</body>
</html>
  `;

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapPress' && onPress) {
        onPress({
          nativeEvent: {
            coordinate: data.coordinate
          }
        });
      }
      
      if (data.type === 'regionChange' && onRegionChangeComplete) {
        onRegionChangeComplete(data.region);
      }
    } catch (e) {
      console.log('Map message parse error:', e);
    }
  }, [onPress, onRegionChangeComplete]);

  const renderLoading = () => (
    <View style={[styles.loadingContainer, { backgroundColor: colors?.surface }]}>
      <ActivityIndicator size="large" color={colors?.primary} />
      <Text style={[styles.loadingText, { color: colors?.textSecondary }]}>
        Harita yükleniyor...
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.webView}
        onMessage={handleMessage}
        renderLoading={renderLoading}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default MapWrapper;
