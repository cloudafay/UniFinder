// Filtre Context
// Keşif filtrelerini global olarak yönetir - AsyncStorage ile persistence

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FILTERS_STORAGE_KEY = '@unifinder_filters';

export interface FilterSettings {
  searchQuery: string;
  lookingFor: string[];
  ageMin: number;
  ageMax: number;
  distance: number;
  verifiedOnly: boolean;
  onlineOnly: boolean;
}

interface FilterContextType {
  filters: FilterSettings;
  updateFilters: (newFilters: Partial<FilterSettings>) => void;
  resetFilters: () => void;
  isLoading: boolean;
}

const defaultFilters: FilterSettings = {
  searchQuery: '',
  lookingFor: ['study'],
  ageMin: 18,
  ageMax: 100,
  distance: 50,
  verifiedOnly: false,
  onlineOnly: false,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterSettings>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);

  // Filtreleri AsyncStorage'dan yükle
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          // Varsayılan değerlerle birleştir (yeni alanlar için)
          setFilters({ ...defaultFilters, ...parsed });
        }
      } catch (error) {
        console.error('Filtreler yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilters();
  }, []);

  // Filtreleri kaydet
  const saveFilters = useCallback(async (newFilters: FilterSettings) => {
    try {
      // searchQuery'yi kaydetme (geçici veri)
      const filtersToSave = { ...newFilters, searchQuery: '' };
      await AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (error) {
      console.error('Filtreler kaydedilemedi:', error);
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<FilterSettings>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      saveFilters(updated);
      return updated;
    });
  }, [saveFilters]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    saveFilters(defaultFilters);
  }, [saveFilters]);

  return (
    <FilterContext.Provider value={{ filters, updateFilters, resetFilters, isLoading }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export default FilterContext;

