// Veri İndirme Ekranı
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

interface DataCategory {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  selected: boolean;
}

const DownloadDataScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const [dataCategories, setDataCategories] = useState<DataCategory[]>([
    { id: 'profile', title: 'Profil Bilgileri', description: 'Ad, yaş, biyografi, üniversite bilgileri', icon: 'person', selected: true },
    { id: 'photos', title: 'Fotoğraflar', description: 'Yüklediğiniz tüm profil fotoğrafları', icon: 'photo-library', selected: true },
    { id: 'messages', title: 'Mesajlar', description: 'Tüm sohbet geçmişiniz', icon: 'chat', selected: true },
    { id: 'matches', title: 'Eşleşmeler', description: 'Eşleşme geçmişiniz ve beğenileriniz', icon: 'favorite', selected: false },
    { id: 'settings', title: 'Ayarlar', description: 'Uygulama tercihleriniz', icon: 'settings', selected: false },
    { id: 'activity', title: 'Aktivite Verisi', description: 'Giriş kayıtları ve uygulama kullanımı', icon: 'timeline', selected: false },
  ]);

  const toggleCategory = (id: string) => {
    setDataCategories(prev =>
      prev.map(cat => cat.id === id ? { ...cat, selected: !cat.selected } : cat)
    );
  };

  const selectAll = () => {
    setDataCategories(prev => prev.map(cat => ({ ...cat, selected: true })));
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleRequestData = async () => {
    const selectedCategories = dataCategories.filter(c => c.selected);
    if (selectedCategories.length === 0) {
      showAlert('Hata', 'Lütfen en az bir veri kategorisi seçin.');
      return;
    }

    setIsRequesting(true);
    
    // Simülasyon - gerçek uygulamada API çağrısı yapılacak
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsRequesting(false);
    setRequestSent(true);
    showAlert(
      'Talep Alındı',
      'Verileriniz hazırlanıyor. 24-48 saat içinde e-posta adresinize indirme bağlantısı gönderilecek.'
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Verilerimi İndir</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
          <MaterialIcons name="download" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Verilerinizi İndirin</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              KVKK kapsamında verilerinizin bir kopyasını talep edebilirsiniz. İndirme bağlantısı e-posta adresinize gönderilecek.
            </Text>
          </View>
        </View>

        {/* Select All */}
        <View style={styles.selectAllRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERİ KATEGORİLERİ</Text>
          <TouchableOpacity onPress={selectAll}>
            <Text style={[styles.selectAllText, { color: Colors.primary }]}>Tümünü Seç</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={[styles.categoriesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {dataCategories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                index !== dataCategories.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: Colors.primary + '15' }]}>
                <MaterialIcons name={category.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>{category.title}</Text>
                <Text style={[styles.categoryDesc, { color: colors.textSecondary }]}>{category.description}</Text>
              </View>
              <View style={[
                styles.checkbox,
                category.selected && styles.checkboxSelected,
                { borderColor: category.selected ? Colors.primary : colors.border }
              ]}>
                {category.selected && <MaterialIcons name="check" size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Request Button */}
        <TouchableOpacity
          style={[
            styles.requestButton,
            { backgroundColor: requestSent ? Colors.success : Colors.primary },
            isRequesting && styles.buttonDisabled
          ]}
          onPress={handleRequestData}
          disabled={isRequesting || requestSent}
        >
          {isRequesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons 
                name={requestSent ? 'check-circle' : 'download'} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.requestButtonText}>
                {requestSent ? 'Talep Gönderildi' : 'Veri İndir Talebinde Bulun'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={18} color={colors.textTertiary} />
            <Text style={[styles.infoItemText, { color: colors.textTertiary }]}>
              İşlem 24-48 saat sürebilir
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="lock" size={18} color={colors.textTertiary} />
            <Text style={[styles.infoItemText, { color: colors.textTertiary }]}>
              Verileriniz şifreli olarak gönderilir
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="timer" size={18} color={colors.textTertiary} />
            <Text style={[styles.infoItemText, { color: colors.textTertiary }]}>
              İndirme bağlantısı 7 gün geçerlidir
            </Text>
          </View>
        </View>
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  categoryDesc: {
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  additionalInfo: {
    marginTop: 24,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoItemText: {
    fontSize: 13,
  },
});

export default DownloadDataScreen;

