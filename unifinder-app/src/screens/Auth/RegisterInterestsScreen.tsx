// Register Interests Screen - İlgi Alanları Seçimi
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterInterest'>;
type RegisterInterestsRouteProp = RouteProp<AuthStackParamList, 'RegisterInterest'>;

// Available interests list
const AVAILABLE_INTERESTS = [
    '🎵 Müzik',
    '⚽ Spor',
    '🎨 Sanat',
    '💻 Teknoloji',
    '✈️ Seyahat',
    '🍕 Yemek',
    '🎮 Oyun',
    '📚 Okuma',
    '🏋️ Fitness',
    '🎬 Film',
    '📸 Fotoğrafçılık',
    '🎭 Tiyatro',
    '🎤 Konser',
    '🏃 Koşu',
    '🧘 Yoga',
    '🎸 Enstrüman',
    '🌱 Doğa',
    '🐾 Hayvanlar',
    '☕ Kahve',
    '🎲 Masa Oyunları',
];

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 10;

const RegisterInterestsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RegisterInterestsRouteProp>();
    const { theme } = useTheme();
    const { register } = useAuth();
    const { width } = useWindowDimensions();
    const isDark = theme === 'dark';

    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Colors based on theme
    const colors = {
        background: isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#667eea', '#764ba2'],
        card: isDark ? 'rgba(20, 20, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        cardBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        text: isDark ? '#ffffff' : '#1a1a2e',
        textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
        textMuted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8',
        chipBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        chipBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        chipActiveBg: '#6366f1',
        primary: '#6366f1',
    };

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(selectedInterests.filter(i => i !== interest));
        } else {
            if (selectedInterests.length < MAX_INTERESTS) {
                setSelectedInterests([...selectedInterests, interest]);
            } else {
                Alert.alert('Limit', `En fazla ${MAX_INTERESTS} ilgi alanı seçebilirsin.`);
            }
        }
    };

    const handleComplete = async () => {
        if (selectedInterests.length < MIN_INTERESTS) {
            Alert.alert('Uyarı', `Lütfen en az ${MIN_INTERESTS} ilgi alanı seç.`);
            return;
        }

        setIsLoading(true);

        try {
            console.log('🎯 Starting registration with interests:', selectedInterests);

            const { error } = await register({
                email: route.params.email,
                password: route.params.password,
                fullName: route.params.fullName,
                department: route.params.department,
                classYear: route.params.classYear,
                bio: route.params.bio,
                photos: route.params.photos,
                interests: selectedInterests,
            });

            if (error) {
                Alert.alert('Kayıt Hatası', error);
                setIsLoading(false);
            } else {
                console.log('✅ Registration successful!');
                // AuthContext will handle navigation automatically
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            Alert.alert('Hata', err.message || 'Kayıt sırasında bir hata oluştu');
            setIsLoading(false);
        }
    };

    const isValid = selectedInterests.length >= MIN_INTERESTS;
    const cardMaxWidth = Math.min(width - 32, 440);

    return (
        <LinearGradient
            colors={colors.background as any}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { maxWidth: cardMaxWidth }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: '#fff' }]}>İlgi Alanları</Text>
                    <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                        Seni daha iyi tanıyalım
                    </Text>
                </View>

                {/* Card */}
                <View style={[
                    styles.card,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                        maxWidth: cardMaxWidth,
                        width: '100%',
                    }
                ]}>
                    {/* Info */}
                    <View style={styles.infoSection}>
                        <View style={[styles.infoIcon, { backgroundColor: `${colors.primary}15` }]}>
                            <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            En az {MIN_INTERESTS}, en fazla {MAX_INTERESTS} ilgi alanı seç
                        </Text>
                    </View>

                    {/* Selected count */}
                    <View style={styles.counterSection}>
                        <Text style={[styles.counterText, { color: colors.text }]}>
                            {selectedInterests.length} / {MAX_INTERESTS} seçildi
                        </Text>
                    </View>

                    {/* Interests Grid */}
                    <View style={styles.interestsGrid}>
                        {AVAILABLE_INTERESTS.map((interest) => {
                            const isSelected = selectedInterests.includes(interest);
                            return (
                                <TouchableOpacity
                                    key={interest}
                                    style={[
                                        styles.interestChip,
                                        {
                                            backgroundColor: isSelected ? colors.chipActiveBg : colors.chipBg,
                                            borderColor: isSelected ? colors.chipActiveBg : colors.chipBorder,
                                        }
                                    ]}
                                    onPress={() => toggleInterest(interest)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.interestText,
                                        { color: isSelected ? '#fff' : colors.text }
                                    ]}>
                                        {interest}
                                    </Text>
                                    {isSelected && (
                                        <MaterialIcons name="check-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Complete Button */}
                    <TouchableOpacity
                        style={[styles.button, !isValid && styles.buttonDisabled]}
                        onPress={handleComplete}
                        disabled={!isValid || isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={isValid ? ['#6366f1', '#8b5cf6'] : ['#9ca3af', '#9ca3af']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Kayıt Tamamla</Text>
                                    <MaterialIcons name="check" size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    header: {
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 15,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    infoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    infoIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
    counterSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    counterText: {
        fontSize: 16,
        fontWeight: '600',
    },
    interestsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    interestChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    interestText: {
        fontSize: 14,
        fontWeight: '500',
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        paddingHorizontal: 24,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default RegisterInterestsScreen;
