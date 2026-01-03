// Arama Geçmişi Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';

interface HistoryItem {
  id: string;
  type: 'search' | 'profile_view' | 'filter';
  text: string;
  timestamp: string;
}

const ClearHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [isClearing, setIsClearing] = useState(false);
  const [historyPaused, setHistoryPaused] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);

  const [recentSearches, setRecentSearches] = useState<HistoryItem[]>([
    { id: '1', type: 'search', text: 'İstanbul Üniversitesi', timestamp: '2 saat önce' },
    { id: '2', type: 'search', text: 'Bilgisayar Mühendisliği', timestamp: '5 saat önce' },
    { id: '3', type: 'profile_view', text: 'Ayşe K. profilini görüntülediniz', timestamp: 'Dün' },
    { id: '4', type: 'filter', text: 'Yaş: 20-25, Mesafe: 10km', timestamp: 'Dün' },
    { id: '5', type: 'search', text: 'ODTÜ', timestamp: '2 gün önce' },
    { id: '6', type: 'profile_view', text: 'Mehmet Y. profilini görüntülediniz', timestamp: '3 gün önce' },
  ]);

  const getIcon = (type: string): keyof typeof MaterialIcons.glyphMap => {
    switch (type) {
      case 'search': return 'search';
      case 'profile_view': return 'person';
      case 'filter': return 'tune';
      default: return 'history';
    }
  };

  const showAlert = (title: string, message: string, buttons?: any[]) => {
    if (Platform.OS === 'web') {
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        if (confirmed && buttons[1]?.onPress) {
          buttons[1].onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleDeleteItem = (id: string) => {
    setRecentSearches(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = async () => {
    showAlert(
      'Geçmişi Temizle',
      'Tüm arama geçmişinizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            await new Promise(resolve => setTimeout(resolve, 1500));
            setRecentSearches([]);
            setIsClearing(false);
            showAlert('Başarılı', 'Arama geçmişiniz temizlendi.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Arama Geçmişi</Text>
        {recentSearches.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} disabled={isClearing}>
            <Text style={[styles.clearAllText, { color: Colors.error }]}>
              {isClearing ? 'Temizleniyor...' : 'Tümünü Sil'}
            </Text>
          </TouchableOpacity>
        )}
        {recentSearches.length === 0 && <View style={{ width: 80 }} />}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="info-outline" size={20} color={Colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Arama geçmişiniz cihazınızda saklanır ve önerileri iyileştirmek için kullanılır.
          </Text>
        </View>

        {isClearing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Geçmiş temizleniyor...
            </Text>
          </View>
        )}

        {!isClearing && recentSearches.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Geçmiş boş
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Arama ve görüntüleme geçmişiniz burada görünecek.
            </Text>
          </View>
        ) : !isClearing && (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {recentSearches.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.historyItem,
                  index !== recentSearches.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                  <MaterialIcons name={getIcon(item.type)} size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.text}
                  </Text>
                  <Text style={[styles.itemTime, { color: colors.textTertiary }]}>
                    {item.timestamp}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <MaterialIcons name="close" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Privacy Options */}
        {!isClearing && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GİZLİLİK SEÇENEKLERİ</Text>
            <View style={[styles.optionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setHistoryPaused(!historyPaused);
                  showAlert(
                    historyPaused ? 'Geçmiş Devam Ediyor' : 'Geçmiş Duraklatıldı',
                    historyPaused 
                      ? 'Arama geçmişiniz artık kaydedilecek.' 
                      : 'Arama geçmişiniz artık kaydedilmeyecek.'
                  );
                }}
              >
                <MaterialIcons 
                  name={historyPaused ? "play-circle-outline" : "pause-circle-outline"} 
                  size={22} 
                  color={historyPaused ? Colors.success : Colors.warning} 
                />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    {historyPaused ? 'Geçmişi Devam Ettir' : 'Geçmişi Duraklat'}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    {historyPaused ? 'Geçmiş şu anda duraklatılmış' : 'Yeni aramalar kaydedilmez'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: historyPaused ? Colors.warning + '20' : Colors.success + '20' }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: historyPaused ? Colors.warning : Colors.success }
                  ]}>
                    {historyPaused ? 'DURAKLATILDI' : 'AKTİF'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={{ height: 1, backgroundColor: colors.border }} />
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setAutoDelete(!autoDelete);
                  showAlert(
                    autoDelete ? 'Otomatik Silme Kapatıldı' : 'Otomatik Silme Açıldı',
                    autoDelete 
                      ? 'Arama geçmişiniz artık otomatik silinmeyecek.' 
                      : '30 günden eski arama geçmişiniz otomatik olarak silinecek.'
                  );
                }}
              >
                <MaterialIcons name="auto-delete" size={22} color={autoDelete ? Colors.success : Colors.info} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    Otomatik Sil
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    30 günden eski geçmişi otomatik sil
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: autoDelete ? Colors.success + '20' : colors.border }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: autoDelete ? Colors.success : colors.textTertiary }
                  ]}>
                    {autoDelete ? 'AÇIK' : 'KAPALI'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  optionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionContent: {
    flex: 1,
    marginLeft: 14,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ClearHistoryScreen;

