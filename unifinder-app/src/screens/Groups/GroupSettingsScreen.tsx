// Grup Ayarları Ekranı - WhatsApp Benzeri
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Web için cross-platform alert helper
const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'Onayla'
) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'İptal', style: 'cancel' },
      { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
  }
};
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { groupChatService, GroupChat, GroupMember } from '../../services/groupChatService';
import { RootStackParamList } from '../../navigation/types';

type GroupSettingsRouteProp = RouteProp<RootStackParamList, 'GroupSettings'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupSettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GroupSettingsRouteProp>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { groupId, groupName: initialGroupName } = route.params;

  // State
  const [group, setGroup] = useState<GroupChat | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mediaAutoDownload, setMediaAutoDownload] = useState(true);

  // Modal states
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const loadGroupData = useCallback(async () => {
    try {
      const [groupResult, membersResult] = await Promise.all([
        groupChatService.getGroupById(groupId),
        groupChatService.getMembers(groupId),
      ]);

      if (groupResult.data) {
        setGroup(groupResult.data);
        setEditedName(groupResult.data.name);
        setEditedDescription(groupResult.data.description || '');
      }

      if (membersResult.data) {
        setMembers(membersResult.data);
        const currentMember = membersResult.data.find(m => m.user_id === user?.id);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
          setIsAdmin(currentMember.role === 'admin');
        }
      }
    } catch (error) {
      console.error('Grup bilgileri yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user?.id]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  // Grup fotoğrafı seçme
  const handleSelectImage = async (useCamera: boolean) => {
    setShowImageOptions(false);

    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadGroupImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Resim seçme hatası:', error);
      Alert.alert('Hata', 'Resim seçilirken bir hata oluştu.');
    }
  };

  // Grup fotoğrafı yükleme
  const uploadGroupImage = async (imageUri: string) => {
    setIsSaving(true);
    try {
      const { url, error } = await groupChatService.uploadGroupImage(groupId, imageUri);
      
      if (error) {
        Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
        return;
      }

      if (url) {
        const updateResult = await groupChatService.updateGroupAvatar(groupId, url);
        if (!updateResult.error) {
          setGroup(prev => prev ? { ...prev, avatar_url: url } : null);
          Alert.alert('Başarılı', 'Grup fotoğrafı güncellendi.');
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Grup fotoğrafını kaldır
  const handleRemoveImage = () => {
    Alert.alert(
      'Fotoğrafı Kaldır',
      'Grup fotoğrafını kaldırmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            setShowImageOptions(false);
            setIsSaving(true);
            try {
              const result = await groupChatService.updateGroupAvatar(groupId, '');
              if (!result.error) {
                setGroup(prev => prev ? { ...prev, avatar_url: null } : null);
              }
            } catch (error) {
              Alert.alert('Hata', 'Fotoğraf kaldırılırken bir hata oluştu.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  // Grup adını kaydet
  const handleSaveName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Hata', 'Grup adı boş olamaz.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await groupChatService.updateGroup(groupId, user?.id || '', {
        name: editedName.trim(),
      });

      if (error) {
        Alert.alert('Hata', error.message || 'Grup adı güncellenemedi.');
      } else {
        setGroup(prev => prev ? { ...prev, name: editedName.trim() } : null);
        setIsEditingName(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Grup adı güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Grup açıklamasını kaydet
  const handleSaveDescription = async () => {
    setIsSaving(true);
    try {
      const { error } = await groupChatService.updateGroup(groupId, user?.id || '', {
        description: editedDescription.trim(),
      });

      if (error) {
        Alert.alert('Hata', error.message || 'Açıklama güncellenemedi.');
      } else {
        setGroup(prev => prev ? { ...prev, description: editedDescription.trim() } : null);
        setIsEditingDescription(false);
      }
    } catch (error) {
      Alert.alert('Hata', 'Açıklama güncellenirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Gruptan ayrıl - Modal aç
  const handleLeaveGroup = () => {
    console.log('🔴 handleLeaveGroup çağrıldı - groupId:', groupId, 'userId:', user?.id);
    setShowLeaveModal(true);
  };

  // Gruptan ayrılma işlemini gerçekleştir
  const confirmLeaveGroup = async () => {
    console.log('🔴 Gruptan ayrılma onaylandı');
    setShowLeaveModal(false);
    setIsSaving(true);
    try {
      const { error } = await groupChatService.leaveGroup(groupId, user?.id || '');
      console.log('🔴 leaveGroup sonucu:', { error });
      
      if (error) {
        Alert.alert('Hata', error.message || 'Gruptan ayrılınamadı.');
      } else {
        console.log('✅ Gruptan başarıyla ayrıldı');
        // Mesajlar sekmesine git
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Messages' } }],
        });
      }
    } catch (err: any) {
      console.error('❌ leaveGroup hatası:', err);
      Alert.alert('Hata', err.message || 'Gruptan ayrılırken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Grubu sil - Modal aç
  const handleDeleteGroup = () => {
    console.log('🔴 handleDeleteGroup çağrıldı - groupId:', groupId, 'userId:', user?.id, 'isAdmin:', isAdmin);
    
    if (!isAdmin) {
      Alert.alert('Hata', 'Bu işlem için yönetici yetkisi gerekli.');
      return;
    }
    
    setShowDeleteModal(true);
  };

  // Grup silme işlemini gerçekleştir
  const confirmDeleteGroup = async () => {
    console.log('🔴 Grup silme onaylandı');
    setShowDeleteModal(false);
    setIsSaving(true);
    try {
      const { error } = await groupChatService.deleteGroup(groupId, user?.id || '');
      console.log('🔴 deleteGroup sonucu:', { error });
            
      if (error) {
        Alert.alert('Hata', error.message || 'Grup silinemedi.');
      } else {
        console.log('✅ Grup başarıyla silindi');
        // Mesajlar sekmesine git
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Messages' } }],
        });
      }
    } catch (err: any) {
      console.error('❌ deleteGroup hatası:', err);
      Alert.alert('Hata', err.message || 'Grup silinirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Üye rolünü değiştir
  const handleChangeRole = (memberId: string, memberName: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const roleText = newRole === 'admin' ? 'Yönetici' : 'Üye';

    const doChange = async () => {
      try {
        const { error } = await groupChatService.updateMemberRole(
          groupId,
          memberId,
          newRole,
          user?.id || ''
        );
        if (error) {
          if (Platform.OS === 'web') {
            window.alert(error.message || 'Rol değiştirilemedi.');
          } else {
            Alert.alert('Hata', error.message || 'Rol değiştirilemedi.');
          }
        } else {
          loadGroupData();
        }
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Rol değiştirilirken bir hata oluştu.');
        } else {
          Alert.alert('Hata', 'Rol değiştirilirken bir hata oluştu.');
        }
      }
    };

    showConfirmAlert(
      'Rol Değiştir',
      `${memberName} kullanıcısını ${roleText} yapmak istediğinize emin misiniz?`,
      doChange,
      'Değiştir'
    );
  };

  // Üyeyi çıkar
  const handleRemoveMember = (memberId: string, memberName: string) => {
    const doRemove = async () => {
      try {
        const { error } = await groupChatService.removeMember(groupId, memberId, user?.id || '');
        if (error) {
          if (Platform.OS === 'web') {
            window.alert(error.message || 'Üye çıkarılamadı.');
          } else {
            Alert.alert('Hata', error.message || 'Üye çıkarılamadı.');
          }
        } else {
          loadGroupData();
        }
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Üye çıkarılırken bir hata oluştu.');
        } else {
          Alert.alert('Hata', 'Üye çıkarılırken bir hata oluştu.');
        }
      }
    };

    showConfirmAlert(
      'Üyeyi Çıkar',
      `${memberName} kullanıcısını gruptan çıkarmak istediğinize emin misiniz?`,
      doRemove,
      'Çıkar'
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const adminCount = members.filter(m => m.role === 'admin').length;
  const memberCount = members.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark || colors.primary]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grup Ayarları</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Grup Profil Bölümü */}
        <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => isAdmin && setShowImageOptions(true)}
            disabled={!isAdmin}
          >
            {group?.avatar_url ? (
              <Image source={{ uri: group.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {group?.name?.charAt(0)?.toUpperCase() || 'G'}
                </Text>
              </View>
            )}
            {isAdmin && (
              <View style={[styles.cameraButton, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="camera-alt" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Grup Adı */}
          <View style={styles.infoRow}>
            {isEditingName ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.editInput, { color: colors.textPrimary, borderColor: colors.primary }]}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Grup adı"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  maxLength={50}
                />
                <TouchableOpacity onPress={handleSaveName} disabled={isSaving}>
                  <MaterialIcons name="check" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setIsEditingName(false); setEditedName(group?.name || ''); }}>
                  <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.infoContent}
                onPress={() => isAdmin && setIsEditingName(true)}
                disabled={!isAdmin}
              >
                <Text style={[styles.groupName, { color: colors.textPrimary }]}>{group?.name}</Text>
                {isAdmin && <MaterialIcons name="edit" size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            )}
          </View>

          {/* Grup Açıklaması */}
          <View style={styles.infoRow}>
            {isEditingDescription ? (
              <View style={styles.editRow}>
                <TextInput
                  style={[styles.editInput, styles.editInputMultiline, { color: colors.textPrimary, borderColor: colors.primary }]}
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Grup açıklaması ekle..."
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  multiline
                  maxLength={500}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity onPress={handleSaveDescription} disabled={isSaving}>
                    <MaterialIcons name="check" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setIsEditingDescription(false); setEditedDescription(group?.description || ''); }}>
                    <MaterialIcons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.infoContent}
                onPress={() => isAdmin && setIsEditingDescription(true)}
                disabled={!isAdmin}
              >
                <Text style={[styles.description, { color: group?.description ? colors.textSecondary : colors.textTertiary }]}>
                  {group?.description || (isAdmin ? 'Açıklama ekle...' : 'Açıklama yok')}
                </Text>
                {isAdmin && <MaterialIcons name="edit" size={18} color={colors.textSecondary} />}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={20} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{memberCount} üye</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="admin-panel-settings" size={20} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{adminCount} yönetici</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name={group?.is_public ? 'public' : 'lock'} size={20} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {group?.is_public ? 'Herkese Açık' : 'Özel'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bildirim Ayarları */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BİLDİRİMLER</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="notifications" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Bildirimler</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  Yeni mesaj bildirimleri
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: `${colors.primary}50` }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="download" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Medya Otomatik İndir</Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  Fotoğraf ve videoları otomatik indir
                </Text>
              </View>
            </View>
            <Switch
              value={mediaAutoDownload}
              onValueChange={setMediaAutoDownload}
              trackColor={{ false: colors.border, true: `${colors.primary}50` }}
              thumbColor={mediaAutoDownload ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Üyeler */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ÜYELER ({memberCount})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GroupMembers', { groupId, groupName: group?.name || '' })}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {members.slice(0, 5).map((member) => {
            const profile = (member as any).profile;
            const isCurrentUser = member.user_id === user?.id;

            return (
              <TouchableOpacity
                key={member.id}
                style={styles.memberItem}
                onPress={() => !isCurrentUser && navigation.navigate('UserProfile', { userId: member.user_id })}
                disabled={isCurrentUser}
              >
                <Image
                  source={{ uri: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U')}` }}
                  style={styles.memberAvatar}
                />
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                      {profile?.full_name || 'Kullanıcı'}
                      {isCurrentUser && ' (Sen)'}
                    </Text>
                    {member.role === 'admin' && (
                      <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}20` }]}>
                        <Text style={[styles.roleText, { color: colors.primary }]}>Yönetici</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.memberDepartment, { color: colors.textTertiary }]}>
                    {profile?.department || 'Bölüm belirtilmemiş'}
                  </Text>
                </View>

                {isAdmin && !isCurrentUser && (
                  <TouchableOpacity
                    style={styles.memberAction}
                    onPress={() => {
                      Alert.alert(
                        'Üye İşlemleri',
                        `${profile?.full_name || 'Kullanıcı'}`,
                        [
                          { text: 'İptal', style: 'cancel' },
                          {
                            text: member.role === 'admin' ? 'Yöneticilikten Al' : 'Yönetici Yap',
                            onPress: () => handleChangeRole(member.user_id, profile?.full_name || 'Kullanıcı', member.role),
                          },
                          {
                            text: 'Gruptan Çıkar',
                            style: 'destructive',
                            onPress: () => handleRemoveMember(member.user_id, profile?.full_name || 'Kullanıcı'),
                          },
                        ]
                      );
                    }}
                  >
                    <MaterialIcons name="more-vert" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tehlikeli İşlemler */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleLeaveGroup}>
            <MaterialIcons name="exit-to-app" size={24} color="#ef4444" />
            <Text style={styles.dangerText}>Gruptan Ayrıl</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteGroup}>
              <MaterialIcons name="delete-forever" size={24} color="#ef4444" />
              <Text style={styles.dangerText}>Grubu Sil</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fotoğraf Seçim Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageOptions(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Grup Fotoğrafı</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleSelectImage(true)}
            >
              <View style={[styles.modalIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>Fotoğraf Çek</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleSelectImage(false)}
            >
              <View style={[styles.modalIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="photo-library" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>Galeriden Seç</Text>
            </TouchableOpacity>

            {group?.avatar_url && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleRemoveImage}
              >
                <View style={[styles.modalIcon, { backgroundColor: '#fef2f2' }]}>
                  <MaterialIcons name="delete" size={24} color="#ef4444" />
                </View>
                <Text style={[styles.modalOptionText, { color: '#ef4444' }]}>Fotoğrafı Kaldır</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalCancel, { backgroundColor: colors.background }]}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Grubu Sil Onay Modalı */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: colors.surface }]}>
            {/* İkon */}
            <View style={styles.confirmIconContainer}>
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                style={styles.confirmIconGradient}
              >
                <MaterialIcons name="delete-forever" size={32} color="#fff" />
              </LinearGradient>
            </View>

            {/* Başlık */}
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
              Grubu Sil
            </Text>

            {/* Grup adı */}
            <View style={[styles.confirmGroupInfo, { backgroundColor: colors.background }]}>
              <Text style={[styles.confirmGroupName, { color: colors.textPrimary }]}>
                {group?.name}
              </Text>
            </View>

            {/* Açıklama */}
            <Text style={[styles.confirmDescription, { color: colors.textSecondary }]}>
              Bu grubu silmek istediğinize emin misiniz?{'\n\n'}
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                Bu işlem geri alınamaz!
              </Text>
              {'\n'}Tüm mesajlar ve grup verileri kalıcı olarak silinecektir.
            </Text>

            {/* Butonlar */}
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmCancelButton, { backgroundColor: colors.background }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.textPrimary }]}>
                  Vazgeç
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDeleteGroup}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.confirmDeleteGradient}
                >
                  <MaterialIcons name="delete" size={18} color="#fff" />
                  <Text style={styles.confirmDeleteText}>Grubu Sil</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gruptan Ayrıl Onay Modalı */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={[styles.confirmModalContent, { backgroundColor: colors.surface }]}>
            {/* İkon */}
            <View style={styles.confirmIconContainer}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.confirmIconGradient}
              >
                <MaterialIcons name="exit-to-app" size={32} color="#fff" />
              </LinearGradient>
            </View>

            {/* Başlık */}
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
              Gruptan Ayrıl
            </Text>

            {/* Grup adı */}
            <View style={[styles.confirmGroupInfo, { backgroundColor: colors.background }]}>
              <Text style={[styles.confirmGroupName, { color: colors.textPrimary }]}>
                {group?.name}
              </Text>
            </View>

            {/* Açıklama */}
            <Text style={[styles.confirmDescription, { color: colors.textSecondary }]}>
              Bu gruptan ayrılmak istediğinize emin misiniz?{'\n\n'}
              Gruba tekrar katılmak için davet almanız gerekebilir.
            </Text>

            {/* Butonlar */}
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmCancelButton, { backgroundColor: colors.background }]}
                onPress={() => setShowLeaveModal(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.textPrimary }]}>
                  Vazgeç
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLeaveButton}
                onPress={confirmLeaveGroup}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.confirmDeleteGradient}
                >
                  <MaterialIcons name="exit-to-app" size={18} color="#fff" />
                  <Text style={styles.confirmDeleteText}>Ayrıl</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saving Overlay */}
      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoRow: {
    width: '100%',
    marginBottom: 12,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  editInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
  },
  section: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberDepartment: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberAction: {
    padding: 8,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dangerText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalCancel: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Confirmation Modal Styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmIconContainer: {
    marginBottom: 20,
  },
  confirmIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  confirmGroupName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  confirmButtons: {
    width: '100%',
    gap: 12,
  },
  confirmCancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmLeaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmDeleteGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default GroupSettingsScreen;
