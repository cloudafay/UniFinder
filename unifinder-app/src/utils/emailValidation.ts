// Email Validation Utility
// Üniversite e-posta doğrulama ve öğrenci rozeti sistemi

// Türkiye üniversite e-posta uzantıları (Rozet için)
const VALID_EDU_DOMAINS = [
  '.edu.tr',      // Türkiye üniversiteleri (Ana hedef)
  '.edu',         // Genel eğitim
  '.ac.uk',       // İngiltere
  '.edu.au',      // Avustralya
];

// Popüler Türk üniversiteleri
const TURKISH_UNIVERSITIES: { [domain: string]: string } = {
  'itu.edu.tr': 'İstanbul Teknik Üniversitesi',
  'boun.edu.tr': 'Boğaziçi Üniversitesi',
  'metu.edu.tr': 'Orta Doğu Teknik Üniversitesi',
  'bilkent.edu.tr': 'Bilkent Üniversitesi',
  'hacettepe.edu.tr': 'Hacettepe Üniversitesi',
  'ankara.edu.tr': 'Ankara Üniversitesi',
  'ege.edu.tr': 'Ege Üniversitesi',
  'deu.edu.tr': 'Dokuz Eylül Üniversitesi',
  'gazi.edu.tr': 'Gazi Üniversitesi',
  'yildiz.edu.tr': 'Yıldız Teknik Üniversitesi',
  'marmara.edu.tr': 'Marmara Üniversitesi',
  'istanbul.edu.tr': 'İstanbul Üniversitesi',
  'iuc.edu.tr': 'İstanbul Üniversitesi-Cerrahpaşa',
  'medipol.edu.tr': 'Medipol Üniversitesi',
  'ozyegin.edu.tr': 'Özyeğin Üniversitesi',
  'sabanciuniv.edu': 'Sabancı Üniversitesi',
  'ku.edu.tr': 'Koç Üniversitesi',
  'bahcesehir.edu.tr': 'Bahçeşehir Üniversitesi',
  'yeditepe.edu.tr': 'Yeditepe Üniversitesi',
  'uskudar.edu.tr': 'Üsküdar Üniversitesi',
  'maltepe.edu.tr': 'Maltepe Üniversitesi',
  'atlas.edu.tr': 'İstanbul Atlas Üniversitesi',
  'gelisim.edu.tr': 'İstanbul Gelişim Üniversitesi',
  'aydin.edu.tr': 'İstanbul Aydın Üniversitesi',
  'arel.edu.tr': 'İstanbul Arel Üniversitesi',
  'kultur.edu.tr': 'İstanbul Kültür Üniversitesi',
  'beykent.edu.tr': 'Beykent Üniversitesi',
  'dogus.edu.tr': 'Doğuş Üniversitesi',
  'nisantasi.edu.tr': 'Nişantaşı Üniversitesi',
  'topkapi.edu.tr': 'İstanbul Topkapı Üniversitesi',
  'altinbas.edu.tr': 'Altınbaş Üniversitesi',
  'isikun.edu.tr': 'Işık Üniversitesi',
  'halic.edu.tr': 'Haliç Üniversitesi',
  'esenyurt.edu.tr': 'İstanbul Esenyurt Üniversitesi',
  'rumeli.edu.tr': 'İstanbul Rumeli Üniversitesi',
  'okan.edu.tr': 'İstanbul Okan Üniversitesi',
  'kent.edu.tr': 'İstanbul Kent Üniversitesi',
  'bilgi.edu.tr': 'İstanbul Bilgi Üniversitesi',
  'ticaret.edu.tr': 'İstanbul Ticaret Üniversitesi',
  'kadir.has.edu.tr': 'Kadir Has Üniversitesi',
  // Anadolu
  'selcuk.edu.tr': 'Selçuk Üniversitesi',
  'akdeniz.edu.tr': 'Akdeniz Üniversitesi',
  'cu.edu.tr': 'Çukurova Üniversitesi',
  'uludag.edu.tr': 'Uludağ Üniversitesi',
  'ktu.edu.tr': 'Karadeniz Teknik Üniversitesi',
  'erciyes.edu.tr': 'Erciyes Üniversitesi',
  'firat.edu.tr': 'Fırat Üniversitesi',
  'inonu.edu.tr': 'İnönü Üniversitesi',
  'atauni.edu.tr': 'Atatürk Üniversitesi',
  'ogu.edu.tr': 'Eskişehir Osmangazi Üniversitesi',
  'anadolu.edu.tr': 'Anadolu Üniversitesi',
  'pau.edu.tr': 'Pamukkale Üniversitesi',
  'sdu.edu.tr': 'Süleyman Demirel Üniversitesi',
  'sakarya.edu.tr': 'Sakarya Üniversitesi',
  'kocaeli.edu.tr': 'Kocaeli Üniversitesi',
  'gtu.edu.tr': 'Gebze Teknik Üniversitesi',
};

export interface EmailValidationResult {
  isValid: boolean;
  isEduEmail: boolean;
  isTurkishEdu: boolean;
  canGetStudentBadge: boolean;
  universityName?: string;
  domain?: string;
  errorMessage?: string;
  badgeMessage?: string;
}

export const emailValidation = {
  // Temel e-posta format kontrolü
  isValidEmailFormat: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // .edu.tr uzantısı kontrolü
  isEduEmail: (email: string): boolean => {
    const lowerEmail = email.toLowerCase();
    return VALID_EDU_DOMAINS.some(domain => lowerEmail.endsWith(domain));
  },

  // Türk üniversitesi kontrolü
  isTurkishEduEmail: (email: string): boolean => {
    return email.toLowerCase().endsWith('.edu.tr');
  },

  // Domain'i çıkar
  extractDomain: (email: string): string => {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  },

  // Üniversite adını bul
  getUniversityName: (email: string): string | undefined => {
    const domain = emailValidation.extractDomain(email);
    return TURKISH_UNIVERSITIES[domain];
  },

  // Tam validasyon
  validateEmail: (email: string): EmailValidationResult => {
    // Boş kontrol
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        isEduEmail: false,
        isTurkishEdu: false,
        canGetStudentBadge: false,
        errorMessage: 'E-posta adresi gerekli',
      };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Format kontrolü
    if (!emailValidation.isValidEmailFormat(trimmedEmail)) {
      return {
        isValid: false,
        isEduEmail: false,
        isTurkishEdu: false,
        canGetStudentBadge: false,
        errorMessage: 'Geçersiz e-posta formatı',
      };
    }

    const domain = emailValidation.extractDomain(trimmedEmail);
    const isEdu = emailValidation.isEduEmail(trimmedEmail);
    const isTurkishEdu = emailValidation.isTurkishEduEmail(trimmedEmail);
    const universityName = emailValidation.getUniversityName(trimmedEmail);

    // Herkes kayıt olabilir, .edu.tr olanlar rozet alır
    if (isTurkishEdu) {
      return {
        isValid: true,
        isEduEmail: true,
        isTurkishEdu: true,
        canGetStudentBadge: true,
        domain,
        universityName,
        badgeMessage: `🎓 Doğrulanmış Öğrenci rozeti alacaksınız${universityName ? ` (${universityName})` : ''}`,
      };
    }

    // Diğer eğitim e-postaları (.edu, .ac.uk vb.)
    if (isEdu) {
      return {
        isValid: true,
        isEduEmail: true,
        isTurkishEdu: false,
        canGetStudentBadge: true,
        domain,
        badgeMessage: '🎓 Uluslararası Öğrenci rozeti alacaksınız',
      };
    }

    // Normal e-posta - kayıt olabilir ama rozet almaz
    return {
      isValid: true,
      isEduEmail: false,
      isTurkishEdu: false,
      canGetStudentBadge: false,
      domain,
      badgeMessage: '💡 İpucu: .edu.tr e-postası ile Doğrulanmış Öğrenci rozeti alabilirsiniz',
    };
  },

  // Üniversite listesini getir (dropdown için)
  getUniversityList: (): Array<{ domain: string; name: string }> => {
    return Object.entries(TURKISH_UNIVERSITIES)
      .map(([domain, name]) => ({ domain, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  },
};

export default emailValidation;
