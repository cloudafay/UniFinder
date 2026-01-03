// UniFinder Ekran İsimleri
// Tüm ekran isimleri burada tanımlanmıştır

export const SCREENS = {
  // Kimlik Doğrulama Ekranları
  SPLASH: 'Splash',
  LOGIN: 'Login',
  REGISTER_BASIC_INFO: 'RegisterBasicInfo',
  REGISTER_PHOTO: 'RegisterPhoto',
  REGISTER_INTEREST: 'RegisterInterest',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Ana Ekranlar
  DISCOVER: 'Discover',
  FILTER_SEARCH: 'FilterSearch',
  MATCH_SUCCESS: 'MatchSuccess',

  // Sohbet Ekranları
  MESSAGE_LIST: 'MessageList',
  CHAT: 'Chat',

  // Profil Ekranları
  USER_PROFILE: 'UserProfile',
  EDIT_PROFILE: 'EditProfile',
  OTHER_PROFILE: 'OtherProfile',

  // Bildirim Ekranları
  NOTIFICATION_CENTER: 'NotificationCenter',

  // Ayarlar Ekranları
  SETTINGS: 'Settings',
  PRIVACY_SETTINGS: 'PrivacySettings',
  NOTIFICATION_SETTINGS: 'NotificationSettings',
  ACCOUNT_SETTINGS: 'AccountSettings',
} as const;

// Navigasyon Yığın İsimleri
export const STACKS = {
  AUTH: 'AuthStack',
  MAIN: 'MainStack',
  CHAT: 'ChatStack',
  PROFILE: 'ProfileStack',
  SETTINGS: 'SettingsStack',
} as const;

// Sekme İsimleri
export const TABS = {
  DISCOVER: 'DiscoverTab',
  MESSAGES: 'MessagesTab',
  PROFILE: 'ProfileTab',
  NOTIFICATIONS: 'NotificationsTab',
} as const;

export default SCREENS;
