// Storage Utility Functions
// AsyncStorage wrapper functions

const STORAGE_KEYS = {
  USER_TOKEN: '@unifinder_token',
  USER_DATA: '@unifinder_user',
  THEME: '@unifinder_theme',
  ONBOARDING: '@unifinder_onboarding',
} as const;

export { STORAGE_KEYS };

// TODO: Implement storage functions after adding AsyncStorage dependency
// export const saveData = async (key: string, value: any) => {};
// export const getData = async (key: string) => {};
// export const removeData = async (key: string) => {};
