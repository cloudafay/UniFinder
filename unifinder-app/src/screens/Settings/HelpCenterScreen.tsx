// Yardım Merkezi Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  description: string;
}

const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const helpCategories: HelpCategory[] = [
    { id: 'account', title: 'Hesap', icon: 'person', color: '#3b82f6', description: 'Hesap ayarları ve güvenlik' },
    { id: 'matching', title: 'Eşleşme', icon: 'favorite', color: '#ef4444', description: 'Eşleşme ve keşif' },
    { id: 'messages', title: 'Mesajlar', icon: 'chat', color: '#22c55e', description: 'Mesajlaşma sorunları' },
    { id: 'safety', title: 'Güvenlik', icon: 'security', color: '#f59e0b', description: 'Güvenlik ve gizlilik' },
    { id: 'payments', title: 'Ödeme', icon: 'payment', color: '#8b5cf6', description: 'Premium ve ödemeler' },
    { id: 'bugs', title: 'Hatalar', icon: 'bug-report', color: '#06b6d4', description: 'Teknik sorunlar' },
  ];

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'Nasıl eşleşme yapabilirim?',
      answer: 'Keşfet ekranında profilleri sağa veya sola kaydırarak eşleşme yapabilirsiniz. Sağa kaydırmak beğeni, sola kaydırmak geçiş anlamına gelir. Her iki taraf da birbirini beğendiğinde eşleşme gerçekleşir.',
      category: 'matching',
    },
    {
      id: '2',
      question: 'Kampüs doğrulaması nasıl yapılır?',
      answer: 'Kayıt olurken .edu.tr uzantılı üniversite e-postanızı kullanmanız gerekmektedir. Kayıt sonrası e-postanıza gönderilen doğrulama linkine tıklayarak hesabınızı doğrulayabilirsiniz.',
      category: 'account',
    },
    {
      id: '3',
      question: 'Birini nasıl engelleyebilirim?',
      answer: 'Profil sayfasında sağ üst köşedeki üç nokta menüsüne tıklayın ve "Engelle" seçeneğini seçin. Engellediğiniz kişi size mesaj gönderemez ve sizi keşfedemez.',
      category: 'safety',
    },
    {
      id: '4',
      question: 'Profilimi nasıl gizleyebilirim?',
      answer: 'Ayarlar > Gizlilik ve Güvenlik bölümünden "Aramada Gizlen" seçeneğini açabilirsiniz. Bu durumda keşfet ekranında görünmezsiniz.',
      category: 'safety',
    },
    {
      id: '5',
      question: 'Mesajlarım neden iletilmiyor?',
      answer: 'Mesajların iletilmesi için aktif internet bağlantısı gereklidir. Ayrıca karşı tarafın sizi engellemiş olabileceğini de kontrol edin.',
      category: 'messages',
    },
    {
      id: '6',
      question: 'Şifremi nasıl değiştirebilirim?',
      answer: 'Ayarlar > Şifre Değiştir bölümünden şifrenizi değiştirebilirsiniz. Güvenlik nedeniyle e-posta adresinize bir sıfırlama linki gönderilir.',
      category: 'account',
    },
  ];

  const filteredFAQs = faqItems.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSupport = () => {
    Linking.openURL('mailto:destek@unifinder.app?subject=Yardım Talebi');
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Yardım Merkezi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={22} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Nasıl yardımcı olabiliriz?"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        {searchQuery.length === 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>KATEGORİLER</Text>
            <View style={styles.categoriesGrid}>
              {helpCategories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setSearchQuery(category.title)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                    <MaterialIcons name={category.icon} size={24} color={category.color} />
                  </View>
                  <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>{category.title}</Text>
                  <Text style={[styles.categoryDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {category.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* FAQ */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {searchQuery ? 'ARAMA SONUÇLARI' : 'SIK SORULAN SORULAR'}
        </Text>
        <View style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {filteredFAQs.length === 0 ? (
            <View style={styles.noResults}>
              <MaterialIcons name="search-off" size={48} color={colors.textTertiary} />
              <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                Sonuç bulunamadı
              </Text>
              <Text style={[styles.noResultsSubtext, { color: colors.textTertiary }]}>
                Farklı anahtar kelimeler deneyin
              </Text>
            </View>
          ) : (
            filteredFAQs.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.faqItem}
                  onPress={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                >
                  <View style={styles.faqQuestion}>
                    <Text style={[styles.faqQuestionText, { color: colors.textPrimary }]}>
                      {item.question}
                    </Text>
                    <MaterialIcons
                      name={expandedFAQ === item.id ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={colors.textSecondary}
                    />
                  </View>
                  {expandedFAQ === item.id && (
                    <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                      {item.answer}
                    </Text>
                  )}
                </TouchableOpacity>
                {index !== filteredFAQs.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))
          )}
        </View>

        {/* Contact Support */}
        <View style={[styles.contactCard, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' }]}>
          <View style={[styles.contactIcon, { backgroundColor: Colors.primary + '20' }]}>
            <MaterialIcons name="headset-mic" size={28} color={Colors.primary} />
          </View>
          <View style={styles.contactContent}>
            <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>
              Aradığınızı bulamadınız mı?
            </Text>
            <Text style={[styles.contactDesc, { color: colors.textSecondary }]}>
              Destek ekibimiz size yardımcı olmaktan mutluluk duyar.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: Colors.primary }]}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactButtonText}>İletişim</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HIZLI BAĞLANTILAR</Text>
        <View style={[styles.quickLinksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Linking.openURL('https://unifinder.app/topluluk-kurallari')}
          >
            <MaterialIcons name="gavel" size={22} color={Colors.primary} />
            <Text style={[styles.quickLinkText, { color: colors.textPrimary }]}>Topluluk Kuralları</Text>
            <MaterialIcons name="open-in-new" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Linking.openURL('https://unifinder.app/guvenlik-ipuclari')}
          >
            <MaterialIcons name="shield" size={22} color="#22c55e" />
            <Text style={[styles.quickLinkText, { color: colors.textPrimary }]}>Güvenlik İpuçları</Text>
            <MaterialIcons name="open-in-new" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Linking.openURL('https://unifinder.app/gizlilik-politikasi')}
          >
            <MaterialIcons name="privacy-tip" size={22} color="#8b5cf6" />
            <Text style={[styles.quickLinkText, { color: colors.textPrimary }]}>Gizlilik Politikası</Text>
            <MaterialIcons name="open-in-new" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 12,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  faqItem: {
    padding: 16,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
  },
  divider: {
    height: 1,
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDesc: {
    fontSize: 13,
  },
  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickLinksCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default HelpCenterScreen;

