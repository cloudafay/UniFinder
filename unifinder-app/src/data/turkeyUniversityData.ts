// Türkiye Üniversite Verileri - Fakülteler ve Bölümler

// Türkiye'deki tüm fakülteler
export const FACULTIES = [
  // Mühendislik Fakülteleri
  'Mühendislik Fakültesi',
  'Mühendislik ve Mimarlık Fakültesi',
  'Mühendislik ve Doğa Bilimleri Fakültesi',
  'Bilgisayar ve Bilişim Fakültesi',
  'Teknoloji Fakültesi',
  
  // Fen ve Edebiyat
  'Fen-Edebiyat Fakültesi',
  'Fen Fakültesi',
  'Edebiyat Fakültesi',
  'İnsan ve Toplum Bilimleri Fakültesi',
  'Sosyal ve Beşeri Bilimler Fakültesi',
  
  // İktisadi ve İdari Bilimler
  'İktisadi ve İdari Bilimler Fakültesi',
  'İşletme Fakültesi',
  'Siyasal Bilgiler Fakültesi',
  'İktisat Fakültesi',
  'Ticari Bilimler Fakültesi',
  
  // Hukuk
  'Hukuk Fakültesi',
  
  // Tıp ve Sağlık
  'Tıp Fakültesi',
  'Diş Hekimliği Fakültesi',
  'Eczacılık Fakültesi',
  'Sağlık Bilimleri Fakültesi',
  'Hemşirelik Fakültesi',
  'Veteriner Fakültesi',
  
  // Eğitim
  'Eğitim Fakültesi',
  'Eğitim Bilimleri Fakültesi',
  'Spor Bilimleri Fakültesi',
  'Beden Eğitimi ve Spor Yüksekokulu',
  
  // İletişim ve Sanat
  'İletişim Fakültesi',
  'Güzel Sanatlar Fakültesi',
  'Mimarlık Fakültesi',
  'Sanat ve Tasarım Fakültesi',
  'Konservatuvar',
  
  // Ziraat ve Orman
  'Ziraat Fakültesi',
  'Orman Fakültesi',
  'Su Ürünleri Fakültesi',
  
  // İlahiyat
  'İlahiyat Fakültesi',
  'İslami İlimler Fakültesi',
  
  // Denizcilik
  'Denizcilik Fakültesi',
  'Deniz Bilimleri Fakültesi',
  
  // Turizm
  'Turizm Fakültesi',
  'Turizm ve Otelcilik Yüksekokulu',
  
  // Havacılık
  'Havacılık ve Uzay Bilimleri Fakültesi',
  'Sivil Havacılık Yüksekokulu',
  
  // Diğer
  'Açık ve Uzaktan Öğretim Fakültesi',
  'Uygulamalı Bilimler Fakültesi',
  'Sağlık Hizmetleri Meslek Yüksekokulu',
].sort((a, b) => a.localeCompare(b, 'tr'));

// Türkiye'deki tüm bölümler (ana bölümler)
export const DEPARTMENTS = [
  // Mühendislik Bölümleri
  'Bilgisayar Mühendisliği',
  'Yazılım Mühendisliği',
  'Yapay Zeka Mühendisliği',
  'Bilişim Sistemleri Mühendisliği',
  'Elektrik-Elektronik Mühendisliği',
  'Elektrik Mühendisliği',
  'Elektronik Mühendisliği',
  'Elektronik ve Haberleşme Mühendisliği',
  'Makine Mühendisliği',
  'Mekatronik Mühendisliği',
  'İnşaat Mühendisliği',
  'Mimarlık',
  'İç Mimarlık',
  'Şehir ve Bölge Planlama',
  'Peyzaj Mimarlığı',
  'Endüstri Mühendisliği',
  'Endüstriyel Tasarım',
  'Kimya Mühendisliği',
  'Biyomühendislik',
  'Biyomedikal Mühendisliği',
  'Gıda Mühendisliği',
  'Çevre Mühendisliği',
  'Metalurji ve Malzeme Mühendisliği',
  'Tekstil Mühendisliği',
  'Otomotiv Mühendisliği',
  'Uçak Mühendisliği',
  'Havacılık ve Uzay Mühendisliği',
  'Uzay Mühendisliği',
  'Jeoloji Mühendisliği',
  'Jeofizik Mühendisliği',
  'Maden Mühendisliği',
  'Petrol ve Doğalgaz Mühendisliği',
  'Enerji Sistemleri Mühendisliği',
  'Kontrol ve Otomasyon Mühendisliği',
  'Telekomünikasyon Mühendisliği',
  'Harita Mühendisliği',
  'Genetik ve Biyomühendislik',
  'Orman Mühendisliği',
  'Ziraat Mühendisliği',
  'Gemi İnşaatı ve Gemi Makineleri Mühendisliği',
  'Deniz Ulaştırma İşletme Mühendisliği',
  
  // Fen Bilimleri
  'Matematik',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Moleküler Biyoloji ve Genetik',
  'İstatistik',
  'Astronomi ve Uzay Bilimleri',
  
  // Sosyal Bilimler
  'Psikoloji',
  'Sosyoloji',
  'Felsefe',
  'Tarih',
  'Coğrafya',
  'Arkeoloji',
  'Sanat Tarihi',
  'Antropoloji',
  
  // Dil ve Edebiyat
  'Türk Dili ve Edebiyatı',
  'İngiliz Dili ve Edebiyatı',
  'Alman Dili ve Edebiyatı',
  'Fransız Dili ve Edebiyatı',
  'İspanyol Dili ve Edebiyatı',
  'Arap Dili ve Edebiyatı',
  'Rus Dili ve Edebiyatı',
  'Çin Dili ve Edebiyatı',
  'Japon Dili ve Edebiyatı',
  'Mütercim-Tercümanlık',
  'Çeviribilim',
  'Amerikan Kültürü ve Edebiyatı',
  'Karşılaştırmalı Edebiyat',
  
  // İktisadi ve İdari Bilimler
  'İktisat',
  'İşletme',
  'Maliye',
  'Kamu Yönetimi',
  'Uluslararası İlişkiler',
  'Siyaset Bilimi',
  'Siyaset Bilimi ve Uluslararası İlişkiler',
  'Çalışma Ekonomisi ve Endüstri İlişkileri',
  'Ekonometri',
  'Bankacılık ve Finans',
  'Uluslararası Ticaret',
  'Uluslararası Ticaret ve Finans',
  'Uluslararası Ticaret ve Lojistik',
  'Lojistik Yönetimi',
  'Yönetim Bilişim Sistemleri',
  'Sigortacılık',
  'Pazarlama',
  'İnsan Kaynakları Yönetimi',
  'Turizm İşletmeciliği',
  'Turizm ve Otel İşletmeciliği',
  'Gastronomi ve Mutfak Sanatları',
  'Havacılık Yönetimi',
  'Sağlık Yönetimi',
  'Spor Yönetimi',
  
  // Hukuk
  'Hukuk',
  
  // Tıp ve Sağlık
  'Tıp',
  'Diş Hekimliği',
  'Eczacılık',
  'Hemşirelik',
  'Ebelik',
  'Fizyoterapi ve Rehabilitasyon',
  'Beslenme ve Diyetetik',
  'Ergoterapi',
  'Odyoloji',
  'Dil ve Konuşma Terapisi',
  'Sosyal Hizmet',
  'Gerontoloji',
  'Acil Yardım ve Afet Yönetimi',
  'Paramedik',
  'Sağlık Yönetimi',
  'Veteriner Hekimliği',
  
  // Eğitim
  'Okul Öncesi Öğretmenliği',
  'Sınıf Öğretmenliği',
  'İlköğretim Matematik Öğretmenliği',
  'Türkçe Öğretmenliği',
  'Sosyal Bilgiler Öğretmenliği',
  'Fen Bilgisi Öğretmenliği',
  'İngilizce Öğretmenliği',
  'Almanca Öğretmenliği',
  'Fransızca Öğretmenliği',
  'Rehberlik ve Psikolojik Danışmanlık',
  'Özel Eğitim Öğretmenliği',
  'Bilgisayar ve Öğretim Teknolojileri Öğretmenliği',
  'Müzik Öğretmenliği',
  'Resim-İş Öğretmenliği',
  'Beden Eğitimi ve Spor Öğretmenliği',
  'Matematik Öğretmenliği',
  'Fizik Öğretmenliği',
  'Kimya Öğretmenliği',
  'Biyoloji Öğretmenliği',
  'Tarih Öğretmenliği',
  'Coğrafya Öğretmenliği',
  'Felsefe Öğretmenliği',
  
  // İletişim
  'Gazetecilik',
  'Radyo, Televizyon ve Sinema',
  'Halkla İlişkiler ve Tanıtım',
  'Reklamcılık',
  'Görsel İletişim Tasarımı',
  'Yeni Medya',
  'Medya ve İletişim',
  'İletişim ve Tasarım',
  
  // Güzel Sanatlar
  'Grafik Tasarım',
  'Resim',
  'Heykel',
  'Seramik',
  'Tekstil Tasarımı',
  'Moda Tasarımı',
  'Endüstriyel Tasarım',
  'Fotoğraf',
  'Sinema ve Televizyon',
  'Sahne Sanatları',
  'Müzik',
  'Opera',
  'Bale',
  'Tiyatro',
  'Geleneksel Türk Sanatları',
  
  // Ziraat ve Orman
  'Bahçe Bitkileri',
  'Bitki Koruma',
  'Tarım Ekonomisi',
  'Tarla Bitkileri',
  'Toprak Bilimi ve Bitki Besleme',
  'Zootekni',
  'Su Ürünleri Mühendisliği',
  'Orman Endüstri Mühendisliği',
  'Yaban Hayatı Ekolojisi ve Yönetimi',
  
  // İlahiyat
  'İlahiyat',
  'İslami İlimler',
  'Din Kültürü ve Ahlak Bilgisi Öğretmenliği',
  
  // Spor
  'Antrenörlük Eğitimi',
  'Rekreasyon',
  'Spor Yöneticiliği',
  'Egzersiz ve Spor Bilimleri',
  
  // Denizcilik
  'Deniz Ulaştırma İşletme',
  'Gemi Makineleri İşletme',
  'Denizcilik İşletmeleri Yönetimi',
  
  // Diğer
  'Pilotaj',
  'Uçak Bakım ve Onarım',
  'Hava Trafik Kontrolörlüğü',
  'Sivil Hava Ulaştırma İşletmeciliği',
  'Çocuk Gelişimi',
  'Yaşlı Bakımı',
  'Tıbbi Dokümantasyon ve Sekreterlik',
  'Tıbbi Laboratuvar Teknikleri',
  'Radyoloji',
  'Anestezi',
  'Ameliyathane Hizmetleri',
  'Bilgi Güvenliği Teknolojisi',
  'Yapay Zeka',
  'Veri Bilimi',
  'Siber Güvenlik',
  'Oyun Tasarımı',
  'Dijital Oyun Tasarımı',
  'E-Ticaret',
  'Dijital Pazarlama',
].sort((a, b) => a.localeCompare(b, 'tr'));

// Arama fonksiyonu - bölüm veya fakülte araması yapar
export const searchData = (query: string, data: string[]): string[] => {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  
  return data.filter(item => {
    const normalizedItem = item.toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
    return normalizedItem.includes(normalizedQuery);
  }).slice(0, 10); // Max 10 sonuç göster
};

export const searchDepartments = (query: string): string[] => searchData(query, DEPARTMENTS);
export const searchFaculties = (query: string): string[] => searchData(query, FACULTIES);

