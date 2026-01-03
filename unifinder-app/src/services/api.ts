// API Service
// Backend API çağrıları (placeholder)

const API_BASE_URL = 'https://api.unifinder.com/v1';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',
  
  // User
  GET_PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  UPLOAD_PHOTO: '/user/photos',
  DELETE_PHOTO: '/user/photos',
  
  // Discovery
  GET_PROFILES: '/discovery/profiles',
  LIKE: '/discovery/like',
  PASS: '/discovery/pass',
  SUPER_LIKE: '/discovery/superlike',
  
  // Matches
  GET_MATCHES: '/matches',
  UNMATCH: '/matches/unmatch',
  
  // Chat
  GET_MESSAGES: '/chat/messages',
  SEND_MESSAGE: '/chat/send',
  
  // Notifications
  GET_NOTIFICATIONS: '/notifications',
  MARK_READ: '/notifications/read',
} as const;

export { API_BASE_URL };

// TODO: Implement API call functions after setting up HTTP client
