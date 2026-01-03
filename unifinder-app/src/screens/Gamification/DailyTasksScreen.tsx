// Günlük Görevler Ekranı
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { gamificationService, DailyTask, UserProgress, TASK_TYPE_LABELS } from '../../services/gamificationService';
import * as Progress from 'react-native-progress';

const DailyTasksScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [tasksResult, progressData] = await Promise.all([
        gamificationService.getDailyTasks(user.id),
        gamificationService.getUserProgress(user.id),
      ]);
      
      if (tasksResult.data) {
        setTasks(tasksResult.data);
      }
      setProgress(progressData);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalXP = tasks.reduce((sum, t) => sum + (t.completed ? t.xp_reward : 0), 0);
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;

  // Seviye için gereken XP
  const xpForNextLevel = progress ? progress.level * 100 : 100;
  const xpProgress = progress ? progress.current_xp / xpForNextLevel : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Günlük Görevler</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Badges' as never)} style={styles.badgeButton}>
          <MaterialIcons name="emoji-events" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Seviye {progress?.level || 1}</Text>
            </View>
            <View style={styles.streakBadge}>
              <MaterialIcons name="local-fire-department" size={16} color="#f59e0b" />
              <Text style={styles.streakText}>{progress?.streak_days || 0} gün</Text>
            </View>
          </View>
          
          <View style={styles.xpContainer}>
            <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>
              {progress?.current_xp || 0} / {xpForNextLevel} XP
            </Text>
            <Progress.Bar
              progress={xpProgress}
              width={null}
              height={8}
              color={colors.primary}
              unfilledColor={`${colors.primary}20`}
              borderWidth={0}
              borderRadius={4}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{progress?.total_xp || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{completedCount}/{tasks.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Görev</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>+{totalXP}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bugün</Text>
            </View>
          </View>
        </View>

        {/* All Completed Bonus */}
        {allCompleted && (
          <View style={[styles.bonusCard, { backgroundColor: '#22c55e20' }]}>
            <MaterialIcons name="celebration" size={24} color="#22c55e" />
            <View style={styles.bonusContent}>
              <Text style={[styles.bonusTitle, { color: '#22c55e' }]}>Tüm Görevler Tamamlandı!</Text>
              <Text style={[styles.bonusText, { color: colors.textSecondary }]}>+50 bonus XP kazandın</Text>
            </View>
          </View>
        )}

        {/* Tasks List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bugünün Görevleri</Text>
        
        {tasks.map((task) => {
          const taskInfo = TASK_TYPE_LABELS[task.task_type] || { title: 'Görev', description: '', icon: '📋' };
          const taskProgress = task.current / task.target;
          
          return (
            <View 
              key={task.id} 
              style={[
                styles.taskCard, 
                { backgroundColor: colors.surface },
                task.completed && styles.taskCompleted
              ]}
            >
              <View style={styles.taskIcon}>
                <Text style={styles.taskEmoji}>{taskInfo.icon}</Text>
              </View>
              
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>
                    {taskInfo.title}
                  </Text>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpBadgeText}>+{task.xp_reward} XP</Text>
                  </View>
                </View>
                
                <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                  {task.target} {taskInfo.description}
                </Text>
                
                <View style={styles.taskProgressRow}>
                  <Progress.Bar
                    progress={taskProgress}
                    width={null}
                    height={6}
                    color={task.completed ? '#22c55e' : colors.primary}
                    unfilledColor={`${colors.primary}15`}
                    borderWidth={0}
                    borderRadius={3}
                    style={styles.taskProgressBar}
                  />
                  <Text style={[styles.taskProgressText, { color: colors.textSecondary }]}>
                    {task.current}/{task.target}
                  </Text>
                </View>
              </View>
              
              {task.completed && (
                <View style={styles.checkmark}>
                  <MaterialIcons name="check-circle" size={24} color="#22c55e" />
                </View>
              )}
            </View>
          );
        })}

        {/* Empty State */}
        {tasks.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Görev Bulunamadı</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Yeni görevler gece yarısı oluşturulacak
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  badgeButton: { padding: 8 },
  content: { flex: 1, paddingHorizontal: 16 },
  progressCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: { color: '#f59e0b', fontWeight: '600', fontSize: 14 },
  xpContainer: { marginBottom: 16 },
  xpLabel: { fontSize: 12, marginBottom: 8 },
  progressBar: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.1)' },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  bonusContent: { flex: 1 },
  bonusTitle: { fontSize: 16, fontWeight: '600' },
  bonusText: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskCompleted: { opacity: 0.7 },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskEmoji: { fontSize: 24 },
  taskContent: { flex: 1 },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: { fontSize: 15, fontWeight: '600' },
  xpBadge: {
    backgroundColor: '#6366f120',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  xpBadgeText: { color: '#6366f1', fontSize: 11, fontWeight: '600' },
  taskDescription: { fontSize: 13, marginBottom: 8 },
  taskProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskProgressBar: { flex: 1 },
  taskProgressText: { fontSize: 12, minWidth: 35 },
  checkmark: { marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});

export default DailyTasksScreen;
