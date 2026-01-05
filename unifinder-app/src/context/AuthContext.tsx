// Auth Context - Supabase Entegrasyonu
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Legacy FileSystem for base64 reading
let FileSystem: any = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
}

interface User {
  id: string;
  email: string;
  fullName: string;
  department: string;
  year: string;
  photos: string[];
  interests: string[];
  isVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  university?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
  department?: string;
  classYear?: string;
  bio?: string;
  interests?: string[];
  photos?: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session;

  // Profil bilgilerini Supabase'den çek
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  // Session'dan User nesnesine dönüştür
  const sessionToUser = async (currentSession: Session): Promise<User | null> => {
    const profile = await fetchProfile(currentSession.user.id);
    
    if (!profile) {
      // Profil henüz oluşturulmamış olabilir (trigger gecikebilir)
      return {
        id: currentSession.user.id,
        email: currentSession.user.email || '',
        fullName: currentSession.user.user_metadata?.fullName || currentSession.user.user_metadata?.full_name || '',
        department: '',
        year: '',
        photos: [],
        interests: [],
        isVerified: false,
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name || '',
      department: profile.department || '',
      year: profile.year || '',
      photos: profile.photos || [],
      interests: profile.interests || [],
      isVerified: profile.is_verified || false,
      avatarUrl: profile.avatar_url || undefined,
      bio: profile.bio || undefined,
      university: profile.university || undefined,
    };
  };

  useEffect(() => {
    // Mevcut session'ı kontrol et
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          const userData = await sessionToUser(currentSession);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        
        setSession(newSession);
        
        if (newSession) {
          const userData = await sessionToUser(newSession);
          setUser(userData);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { error: error.message };
      }

      console.log('Login successful:', data.user?.email);
      return {};
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || 'Giriş başarısız' };
    }
  };

  const register = async (data: RegisterData): Promise<{ error?: string }> => {
    try {
      console.log('Starting Supabase signUp...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            fullName: data.fullName,
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        console.error('Register error:', authError);
        // Rate limit hatası için daha açıklayıcı mesaj
        if (authError.message.includes('security purposes')) {
          return { error: 'Çok fazla deneme yaptınız. Lütfen 1 dakika bekleyin.' };
        }
        return { error: authError.message };
      }

      console.log('SignUp response:', {
        user: authData.user?.email,
        session: !!authData.session,
        identities: authData.user?.identities?.length,
      });

      // Check if user already exists (identities empty = existing user)
      if (authData.user && authData.user.identities?.length === 0) {
        return { error: 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.' };
      }

      // Kullanıcı oluşturuldu
      if (authData.user) {
        // Session varsa direkt kullan, yoksa login yap
        let currentSession = authData.session;
        
        console.log('📝 Registration - checking session:', { hasSession: !!currentSession });
        
        if (!currentSession) {
          console.log('⚠️ No session from signUp, attempting auto-login...');
          // Email doğrulama kapalıysa, direkt login yapabiliriz
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          
          if (loginError) {
            console.error('❌ Auto-login error:', loginError.message);
            // Email doğrulama açık - profili yine de güncellemeye çalış
            console.log('📝 Trying to update profile without session...');
            
            // Fotoğrafları yükle (public erişim)
            let uploadedPhotoUrls: string[] = [];
            if (data.photos && data.photos.length > 0) {
              console.log('📸 Uploading photos without session...');
              for (let i = 0; i < data.photos.length; i++) {
                const photoUri = data.photos[i];
                if (photoUri) {
                  try {
                    const fileName = `${authData.user.id}/photo_${i}_${Date.now()}.jpg`;
                    let uploadData: ArrayBuffer | Blob;
                    
                    // Platform'a göre farklı yükleme yöntemi
                    if (Platform.OS !== 'web') {
                      // Mobile: FileSystem ile base64 oku
                      console.log('📱 Mobile upload: Reading file as base64...');
                      const fileInfo = await FileSystem.getInfoAsync(photoUri);
                      console.log('📁 File info:', fileInfo);
                      
                      const base64 = await FileSystem.readAsStringAsync(photoUri, {
                        encoding: FileSystem.EncodingType?.Base64 || 'base64',
                      });
                      console.log('📝 Base64 length:', base64?.length);
                      uploadData = decode(base64);
                      console.log('✅ ArrayBuffer created, size:', uploadData.byteLength);
                    } else {
                      // Web: fetch ile blob al
                      const response = await fetch(photoUri);
                      uploadData = await response.blob();
                    }
                    
                    const { error: uploadError } = await supabase.storage
                      .from('photos')
                      .upload(fileName, uploadData, { 
                        contentType: 'image/jpeg', 
                        upsert: true 
                      });
                    
                    if (!uploadError) {
                      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
                      uploadedPhotoUrls.push(publicUrl);
                      console.log(`✅ Photo ${i} uploaded:`, publicUrl);
                    } else {
                      console.error(`❌ Photo ${i} upload error:`, uploadError.message);
                    }
                  } catch (err: any) {
                    console.error(`❌ Photo ${i} failed:`, err?.message || err);
                  }
                }
              }
            }
            
            // Profili güncelle (service key ile yapılabilir veya trigger ile)
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                full_name: data.fullName,
                department: data.department,
                year: data.classYear,
                bio: data.bio,
                interests: data.interests || [],
                photos: uploadedPhotoUrls,
                avatar_url: uploadedPhotoUrls[0] || null,
              })
              .eq('id', authData.user.id);
            
            if (profileError) {
              console.error('❌ Profile update error (no session):', profileError);
            } else {
              console.log('✅ Profile updated without session');
            }
            
            return { 
              error: 'Kayıt başarılı! E-posta adresinizi doğrulamanız gerekiyor.' 
            };
          }
          
          currentSession = loginData.session;
          console.log('✅ Auto-login successful');
        }

        if (currentSession) {
          // Kısa bir gecikme ekle (trigger'ın çalışması için)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          console.log('Updating profile for user:', authData.user.id);
          
          // Fotoğrafları Supabase Storage'a yükle
          let uploadedPhotoUrls: string[] = [];
          if (data.photos && data.photos.length > 0) {
            console.log('Uploading photos to Supabase Storage...', data.photos.length, 'photos');
            for (let i = 0; i < data.photos.length; i++) {
              const photoUri = data.photos[i];
              if (photoUri) {
                try {
                  const fileName = `${authData.user.id}/photo_${i}_${Date.now()}.jpg`;
                  console.log(`📸 Uploading photo ${i}:`, fileName);
                  
                  let uploadResult;
                  
                  // Mobile için FileSystem kullan
                  if (Platform.OS !== 'web') {
                    console.log('📱 Mobile photo upload with FileSystem...');
                    const fileInfo = await FileSystem.getInfoAsync(photoUri);
                    console.log('📁 File exists:', fileInfo.exists);
                    
                    const base64Data = await FileSystem.readAsStringAsync(photoUri, {
                      encoding: FileSystem.EncodingType?.Base64 || 'base64',
                    });
                    console.log('📝 Base64 data length:', base64Data?.length);
                    
                    uploadResult = await supabase.storage
                      .from('photos')
                      .upload(fileName, decode(base64Data), {
                        contentType: 'image/jpeg',
                        upsert: true,
                      });
                  } else {
                    // Web için fetch kullan
                    const response = await fetch(photoUri);
                    const blob = await response.blob();
                    
                    uploadResult = await supabase.storage
                      .from('photos')
                      .upload(fileName, blob, {
                        contentType: 'image/jpeg',
                        upsert: true,
                      });
                  }
                  
                  if (uploadResult.error) {
                    console.error(`❌ Photo ${i} upload error:`, uploadResult.error.message);
                  } else {
                    const { data: { publicUrl } } = supabase.storage
                      .from('photos')
                      .getPublicUrl(fileName);
                    uploadedPhotoUrls.push(publicUrl);
                    console.log(`✅ Photo ${i} uploaded:`, publicUrl);
                  }
                } catch (err: any) {
                  console.error(`❌ Photo ${i} upload failed:`, err?.message || err);
                }
              }
            }
          }
          
          console.log('📝 Updating profile with', uploadedPhotoUrls.length, 'photos');
          
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: data.fullName,
              department: data.department,
              year: data.classYear,
              bio: data.bio,
              interests: data.interests || [],
              photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : [],
              avatar_url: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : null,
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('❌ Profile update error:', profileError.message);
          } else {
            console.log('✅ Profile updated successfully with', uploadedPhotoUrls.length, 'photos');
          }

          // Session ve user'ı hemen set et
          setSession(currentSession);
          const userData = await sessionToUser(currentSession);
          setUser(userData);
        }
      }

      console.log('Registration successful:', authData.user?.email);
      return {};
    } catch (error: any) {
      console.error('Register error:', error);
      return { error: error.message || 'Kayıt başarısız' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<{ error?: string }> => {
    if (!user || !session) {
      return { error: 'Kullanıcı oturumu bulunamadı' };
    }

    try {
      console.log('📝 updateUser called with:', userData);
      
      // Fotoğrafları Storage'a yükle (eğer yerel URI ise)
      let uploadedPhotos: string[] = [];
      if (userData.photos && userData.photos.length > 0) {
        console.log('📸 Uploading photos...', userData.photos.length);
        
        for (let i = 0; i < userData.photos.length; i++) {
          const photoUri = userData.photos[i];
          
          // Zaten Supabase URL'i ise yükleme yapma
          if (photoUri.includes('supabase.co')) {
            console.log(`📸 Photo ${i} already uploaded:`, photoUri.substring(0, 50));
            uploadedPhotos.push(photoUri);
            continue;
          }
          
          // Yerel dosyayı yükle
          try {
            console.log(`📸 Uploading photo ${i}:`, photoUri.substring(0, 50));
            const fileName = `${user.id}/photo_${i}_${Date.now()}.jpg`;
            
            const response = await fetch(photoUri);
            const blob = await response.blob();
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('photos')
              .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: true,
              });
            
            if (uploadError) {
              console.error(`❌ Photo ${i} upload error:`, uploadError);
              // Hata olsa bile devam et, yerel URI'yi kullanma
              continue;
            }
            
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(fileName);
            
            console.log(`✅ Photo ${i} uploaded:`, publicUrl.substring(0, 50));
            uploadedPhotos.push(publicUrl);
          } catch (err) {
            console.error(`❌ Photo ${i} upload exception:`, err);
          }
        }
      }

      // Avatar URL'i ayarla
      let avatarUrl = userData.avatarUrl;
      if (avatarUrl && !avatarUrl.includes('supabase.co') && !avatarUrl.includes('ui-avatars.com')) {
        // Avatar'ı da yükle
        try {
          const fileName = `${user.id}/avatar_${Date.now()}.jpg`;
          const response = await fetch(avatarUrl);
          const blob = await response.blob();
          
          const { error: avatarError } = await supabase.storage
            .from('photos')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: true,
            });
          
          if (!avatarError) {
            const { data: { publicUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(fileName);
            avatarUrl = publicUrl;
            console.log('✅ Avatar uploaded:', avatarUrl.substring(0, 50));
          }
        } catch (err) {
          console.error('❌ Avatar upload error:', err);
        }
      }

      // Veritabanını güncelle
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (userData.fullName) updateData.full_name = userData.fullName;
      if (userData.bio !== undefined) updateData.bio = userData.bio;
      if (userData.department) updateData.department = userData.department;
      if (userData.year) updateData.class_year = userData.year;
      if (userData.interests) updateData.interests = userData.interests;
      if (uploadedPhotos.length > 0) updateData.photos = uploadedPhotos;
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      console.log('💾 Saving to database:', updateData);

      const { error: dbError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (dbError) {
        console.error('❌ Database update error:', dbError);
        return { error: dbError.message };
      }

      console.log('✅ Profile saved to database');

      // Local state'i güncelle
      setUser({
        ...user,
        ...userData,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : (userData.photos || user.photos),
        avatarUrl: avatarUrl || userData.avatarUrl || user.avatarUrl,
      });

      return {};
    } catch (error: any) {
      console.error('❌ updateUser error:', error);
      return { error: error.message || 'Profil güncellenirken hata oluştu' };
    }
  };

  const refreshProfile = async () => {
    if (session) {
      const userData = await sessionToUser(session);
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
