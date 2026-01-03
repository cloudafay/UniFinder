// Kullanım Koşulları Ekranı
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants';

interface Section {
  id: string;
  title: string;
  content: string;
}

const TermsOfServiceScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>('1');

  const sections: Section[] = [
    {
      id: '1',
      title: 'Hizmet Şartları',
      content: `UniFinder, üniversite öğrencileri için tasarlanmış bir sosyal eşleşme platformudur. Bu hizmeti kullanarak, aşağıdaki koşulları kabul etmiş sayılırsınız:

• 18 yaşından büyük olmalısınız
• Geçerli bir .edu.tr e-posta adresine sahip olmalısınız
• Gerçek kimlik bilgilerinizi kullanmalısınız
• Topluluk kurallarına uymalısınız`,
    },
    {
      id: '2',
      title: 'Kullanıcı Sorumlulukları',
      content: `Kullanıcı olarak aşağıdaki sorumluluklara sahipsiniz:

• Profilinizde doğru ve güncel bilgiler paylaşmak
• Diğer kullanıcılara saygılı davranmak
• Spam veya istenmeyen içerik paylaşmamak
• Taciz, nefret söylemi veya şiddete teşvik edici davranışlardan kaçınmak
• Telif hakkı korumalı içerikleri izinsiz paylaşmamak`,
    },
    {
      id: '3',
      title: 'Gizlilik ve Veri Koruma',
      content: `Gizliliğiniz bizim için önemlidir:

• Kişisel verileriniz KVKK kapsamında korunmaktadır
• Verileriniz üçüncü taraflarla izniniz olmadan paylaşılmaz
• Konum bilgileriniz yalnızca eşleşme için kullanılır
• Mesajlarınız şifrelenerek saklanır
• İstediğiniz zaman verilerinizin silinmesini talep edebilirsiniz`,
    },
    {
      id: '4',
      title: 'Topluluk Kuralları',
      content: `UniFinder topluluğunda aşağıdaki davranışlar yasaktır:

• Sahte profil oluşturma
• Diğer kullanıcıları taciz etme
• Uygunsuz veya müstehcen içerik paylaşma
• Ticari veya reklam amaçlı kullanım
• Kişisel bilgileri izinsiz paylaşma
• Yasadışı faaliyetlere teşvik`,
    },
    {
      id: '5',
      title: 'Hesap Askıya Alma ve Fesih',
      content: `Aşağıdaki durumlarda hesabınız askıya alınabilir veya kalıcı olarak kapatılabilir:

• Topluluk kurallarının ihlali
• Sahte profil kullanımı
• Diğer kullanıcılardan gelen şikayetler
• Spam veya kötü amaçlı aktivite
• Yasal yükümlülüklerin ihlali

Hesap kapatma kararına itiraz etmek için destek@unifinder.app adresine başvurabilirsiniz.`,
    },
    {
      id: '6',
      title: 'Fikri Mülkiyet',
      content: `UniFinder ve tüm içeriği fikri mülkiyet hakları ile korunmaktadır:

• Logo, tasarım ve içerikler UniFinder'a aittir
• Kullanıcılar tarafından paylaşılan içeriklerin hakları kullanıcılara aittir
• İçeriklerin izinsiz kopyalanması yasaktır
• Kullanıcılar, paylaştıkları içeriklerin lisansını UniFinder'a vermiş sayılır`,
    },
    {
      id: '7',
      title: 'Sorumluluk Reddi',
      content: `UniFinder aşağıdaki konularda sorumluluk kabul etmez:

• Kullanıcılar arasındaki etkileşimlerden doğan sorunlar
• Kullanıcıların paylaştığı içeriklerin doğruluğu
• Teknik aksaklıklar nedeniyle oluşan veri kayıpları
• Üçüncü taraf hizmetlerinden kaynaklanan sorunlar
• Kullanıcıların gerçek hayatta yaşadığı deneyimler`,
    },
    {
      id: '8',
      title: 'İletişim',
      content: `Sorularınız veya şikayetleriniz için bizimle iletişime geçebilirsiniz:

📧 E-posta: destek@unifinder.app
📍 Adres: İstanbul, Türkiye
🌐 Web: www.unifinder.app

Tüm başvurular 48 saat içinde yanıtlanır.`,
    },
  ];

  const renderSection = (section: Section, index: number) => {
    const isExpanded = expandedSection === section.id;

    return (
      <View key={section.id}>
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            isExpanded && { backgroundColor: Colors.primary + '08' }
          ]}
          onPress={() => setExpandedSection(isExpanded ? null : section.id)}
        >
          <View style={styles.sectionNumber}>
            <Text style={[styles.sectionNumberText, { color: Colors.primary }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {section.title}
          </Text>
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={[styles.sectionContent, { borderLeftColor: Colors.primary }]}>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        )}
        {index !== sections.length - 1 && (
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        )}
      </View>
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Kullanım Koşulları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' }]}>
          <MaterialIcons name="description" size={24} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
              Son Güncelleme: 28 Aralık 2024
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Bu koşullar UniFinder kullanımınızı düzenler. Lütfen dikkatlice okuyun.
            </Text>
          </View>
        </View>

        {/* Sections */}
        <View style={[styles.sectionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {sections.map((section, index) => renderSection(section, index))}
        </View>

        {/* Accept Notice */}
        <View style={styles.acceptNotice}>
          <MaterialIcons name="check-circle" size={20} color={Colors.success} />
          <Text style={[styles.acceptText, { color: colors.textSecondary }]}>
            UniFinder'ı kullanarak bu koşulları kabul etmiş sayılırsınız.
          </Text>
        </View>

        {/* Version Info */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Versiyon 1.0.0 • © 2024 UniFinder
        </Text>
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 58,
    borderLeftWidth: 2,
    marginLeft: 30,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginLeft: 58,
  },
  acceptNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  acceptText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
});

export default TermsOfServiceScreen;

