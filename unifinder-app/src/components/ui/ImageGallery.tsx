// Image Gallery Component
// Fotoğraflara tıklayınca tam ekran galeri

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface ImageGalleryProps {
  images: string[];
  visible: boolean;
  initialIndex?: number;
  onClose: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  visible,
  initialIndex = 0,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      // Scroll to initial index
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    } else {
      opacity.setValue(0);
    }
  }, [visible, initialIndex]);

  const handleClose = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderImage = ({ item, index }: { item: string; index: number }) => {
    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      <Animated.View style={[styles.container, { opacity }]}>
        {/* Background */}
        <TouchableOpacity
          style={styles.background}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          
          <View style={styles.placeholder} />
        </View>

        {/* Images */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(item, index) => `${item}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />

        {/* Dots Indicator */}
        {images.length > 1 && (
          <View style={[styles.dotsContainer, { paddingBottom: insets.bottom + 16 }]}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Navigation Arrows (for web) */}
        {Platform.OS === 'web' && images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonLeft]}
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index: currentIndex - 1 });
                }}
              >
                <MaterialIcons name="chevron-left" size={40} color="#fff" />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonRight]}
                onPress={() => {
                  flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
                }}
              >
                <MaterialIcons name="chevron-right" size={40} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
      </Animated.View>
    </Modal>
  );
};

// Thumbnail Grid for selecting images
interface ImageThumbnailGridProps {
  images: string[];
  onImagePress: (index: number) => void;
  columns?: number;
}

export const ImageThumbnailGrid: React.FC<ImageThumbnailGridProps> = ({
  images,
  onImagePress,
  columns = 3,
}) => {
  const imageSize = (width - 32 - (columns - 1) * 8) / columns;

  return (
    <View style={styles.gridContainer}>
      {images.map((image, index) => (
        <TouchableOpacity
          key={`${image}-${index}`}
          style={[styles.thumbnail, { width: imageSize, height: imageSize }]}
          onPress={() => onImagePress(index)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: image }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Hook for using image gallery
export const useImageGallery = () => {
  const [galleryState, setGalleryState] = useState<{
    visible: boolean;
    images: string[];
    initialIndex: number;
  }>({
    visible: false,
    images: [],
    initialIndex: 0,
  });

  const openGallery = (images: string[], initialIndex: number = 0) => {
    setGalleryState({
      visible: true,
      images,
      initialIndex,
    });
  };

  const closeGallery = () => {
    setGalleryState(prev => ({
      ...prev,
      visible: false,
    }));
  };

  return {
    galleryState,
    openGallery,
    closeGallery,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  imageContainer: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: width,
    height: height * 0.8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  // Navigation buttons (web)
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  // Thumbnail Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  thumbnail: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default ImageGallery;
