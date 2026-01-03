// Soru-Cevap Düzenleme Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { promptService, ProfilePrompt, UserPromptAnswer } from '../../services/promptService';

const CATEGORY_LABELS: Record<string, string> = {
  personality: 'Kişilik',
  lifestyle: 'Yaşam Tarzı',
  fun: 'Eğlence',
  dating: 'İlişki',
};

const EditPromptsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [availablePrompts, setAvailablePrompts] = useState<ProfilePrompt[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserPromptAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingAnswer, setEditingAnswer] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [promptsResult, answersResult] = await Promise.all([
        promptService.getAvailablePrompts(),
        promptService.getUserAnswers(user.id),
      ]);
      
      if (promptsResult.data) {
        setAvailablePrompts(promptsResult.data);
      }
      if (answersResult.data) {
        setUserAnswers(answersResult.data);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPrompt = () => {
    if (userAnswers.length >= 3) {
      Alert.alert('Limit', 'En fazla 3 soru-cevap ekleyebilirsin');
      return;
    }
    setEditingIndex(null);
    setSelectedPromptId(null);
    setEditingAnswer('');
    setShowPromptPicker(true);
  };

  const handleEditPrompt = (index: number) => {
    const answer = userAnswers[index];
    setEditingIndex(index);
    setSelectedPromptId(answer.prompt_id);
    setEditingAnswer(answer.answer);
    setShowPromptPicker(true);
  };

  const handleDeletePrompt = (index: number) => {
    Alert.alert(
      'Sil',
      'Bu cevabı silmek istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            const answer = userAnswers[index];
            await promptService.deleteUserAnswer(user.id, answer.prompt_id);
            loadData();
          },
        },
      ]
    );
  };

  const handleSavePrompt = async () => {
    if (!user?.id || !selectedPromptId || !editingAnswer.trim()) {
      Alert.alert('Hata', 'Lütfen bir soru seç ve cevap yaz');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await promptService.saveUserAnswer(user.id, selectedPromptId, editingAnswer.trim());
      
      if (error) {
        Alert.alert('Hata', error);
      } else {
        setShowPromptPicker(false);
        loadData();
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir sorun oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const getPromptById = (promptId: string) => {
    return availablePrompts.find(p => p.id === promptId);
  };

  const usedPromptIds = new Set(userAnswers.map(a => a.prompt_id));
  const availableForSelection = availablePrompts.filter(p => 
    !usedPromptIds.has(p.id) || p.id === selectedPromptId
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Soru-Cevap</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10` }]}>
          <MaterialIcons name="lightbulb-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Soru-cevaplar profilini daha ilgi çekici yapar ve sohbet başlatmayı kolaylaştırır.
          </Text>
        </View>

        {/* User Answers */}
        {userAnswers.map((answer, index) => {
          const prompt = getPromptById(answer.prompt_id);
          return (
            <View key={answer.id} style={[styles.answerCard, { backgroundColor: colors.surface }]}>
              <View style={styles.answerHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>
                    {CATEGORY_LABELS[(prompt as any)?.category] || 'Soru'}
                  </Text>
                </View>
                <View style={styles.answerActions}>
                  <TouchableOpacity onPress={() => handleEditPrompt(index)} style={styles.actionBtn}>
                    <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePrompt(index)} style={styles.actionBtn}>
                    <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.questionText, { color: colors.textSecondary }]}>
                {prompt?.question || 'Soru'}
              </Text>
              <Text style={[styles.answerText, { color: colors.textPrimary }]}>
                {answer.answer}
              </Text>
              {answer.likes_count > 0 && (
                <View style={styles.likesRow}>
                  <MaterialIcons name="favorite" size={14} color="#ef4444" />
                  <Text style={[styles.likesText, { color: colors.textTertiary }]}>
                    {answer.likes_count} beğeni
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Add Button */}
        {userAnswers.length < 3 && (
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.primary }]}
            onPress={handleAddPrompt}
          >
            <MaterialIcons name="add" size={24} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              Soru-Cevap Ekle ({userAnswers.length}/3)
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Prompt Picker Modal */}
      <Modal
        visible={showPromptPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPromptPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPromptPicker(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingIndex !== null ? 'Düzenle' : 'Soru Seç'}
            </Text>
            <TouchableOpacity onPress={handleSavePrompt} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary }]}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Prompt Selection */}
            <Text style={[styles.modalSectionTitle, { color: colors.textPrimary }]}>Soru</Text>
            {availableForSelection.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                style={[
                  styles.promptOption,
                  { backgroundColor: colors.surface },
                  selectedPromptId === prompt.id && styles.promptOptionSelected
                ]}
                onPress={() => setSelectedPromptId(prompt.id)}
              >
                <View style={styles.promptOptionContent}>
                  <Text style={[styles.promptOptionCategory, { color: colors.textTertiary }]}>
                    {CATEGORY_LABELS[prompt.category]}
                  </Text>
                  <Text style={[styles.promptOptionText, { color: colors.textPrimary }]}>
                    {prompt.question}
                  </Text>
                </View>
                {selectedPromptId === prompt.id && (
                  <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            {/* Answer Input */}
            {selectedPromptId && (
              <View style={styles.answerInputSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textPrimary }]}>Cevabın</Text>
                <TextInput
                  style={[styles.answerInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                  placeholder="Cevabını yaz..."
                  placeholderTextColor={colors.textTertiary}
                  value={editingAnswer}
                  onChangeText={setEditingAnswer}
                  multiline
                  maxLength={300}
                />
                <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                  {editingAnswer.length}/300
                </Text>
              </View>
            )}

            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  infoCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  answerCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  answerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  questionText: { fontSize: 13, marginBottom: 8 },
  answerText: { fontSize: 16, lineHeight: 24 },
  likesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  likesText: { fontSize: 12 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addButtonText: { fontSize: 15, fontWeight: '600' },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSave: { fontSize: 16, fontWeight: '600' },
  modalContent: { flex: 1, padding: 16 },
  modalSectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 8 },
  promptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  promptOptionSelected: { borderWidth: 2, borderColor: '#6366f1' },
  promptOptionContent: { flex: 1 },
  promptOptionCategory: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  promptOptionText: { fontSize: 14 },
  answerInputSection: { marginTop: 20 },
  answerInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 6 },
});

export default EditPromptsScreen;
