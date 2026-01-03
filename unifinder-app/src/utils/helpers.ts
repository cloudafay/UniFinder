// Utility Functions

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR');
};

/**
 * Format time for chat messages
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate university email (.edu)
 */
export const isValidUniversityEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith('.edu');
};

/**
 * Calculate age from birthdate
 */
export const calculateAge = (birthdate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Class year labels map (ID -> Turkish label)
 */
export const CLASS_YEAR_LABELS: Record<string, string> = {
  'prep': 'Hazırlık',
  'freshman': '1. Sınıf',
  'sophomore': '2. Sınıf',
  'junior': '3. Sınıf',
  'senior': '4. Sınıf',
  'grad': 'Y. Lisans',
};

/**
 * Get class year label from ID
 */
export const getClassYearLabel = (yearId: string | undefined | null): string => {
  if (!yearId) return 'Sınıf';
  return CLASS_YEAR_LABELS[yearId] || yearId;
};
