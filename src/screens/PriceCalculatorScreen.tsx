import React, { useState, useMemo } from 'react'
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../theme/theme'
import FeatherIcon from 'react-native-vector-icons/Feather'

export default function PriceCalculatorScreen() {
    const insets = useSafeAreaInsets()
    const [propertyPrice, setPropertyPrice] = useState('3,300,000')
    const [selfEquity, setSelfEquity] = useState('2,000,000')

    // Helper to parse localized numbers
    const parseNumber = (val: string) => {
        return parseFloat(val.replace(/,/g, '')) || 0
    }

    // Helper to format numbers back to localized string
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('he-IL').format(num)
    }

    const handlePriceChange = (val: string) => {
        const clean = val.replace(/[^0-9]/g, '')
        const num = parseInt(clean, 10) || 0
        setPropertyPrice(formatNumber(num))
    }

    const handleEquityChange = (val: string) => {
        const clean = val.replace(/[^0-9]/g, '')
        const num = parseInt(clean, 10) || 0
        setSelfEquity(formatNumber(num))
    }

    // Derived calculations
    const { mortgageAmount, monthlyReturn } = useMemo(() => {
        const price = parseNumber(propertyPrice)
        const equity = parseNumber(selfEquity)
        const mortgage = Math.max(0, price - equity)

        // Formula: 520 NIS for every 100,000 NIS in mortgage
        const returnVal = (mortgage / 100000) * 520

        return {
            mortgageAmount: mortgage,
            monthlyReturn: returnVal
        }
    }, [propertyPrice, selfEquity])

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Price Calculator</Text>
                    <Text style={styles.headerSubtitle}>Estimate your monthly payments</Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Input Section */}
                        <View style={styles.section}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Property Price</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        value={propertyPrice}
                                        onChangeText={handlePriceChange}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                    <Text style={styles.currency}>₪</Text>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Self Equity</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        value={selfEquity}
                                        onChangeText={handleEquityChange}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                    <Text style={styles.currency}>₪</Text>
                                </View>
                            </View>
                        </View>

                        {/* Mortgage Result Card */}
                        <View style={styles.mortgageCard}>
                            <View style={styles.cardHeader}>
                                <FeatherIcon name="home" size={20} color={theme.colors.primary} />
                                <Text style={styles.cardTitle}>Required Mortgage</Text>
                            </View>
                            <Text style={styles.mortgageValue}>₪ {formatNumber(mortgageAmount)}</Text>
                        </View>

                        {/* Monthly Payment Section */}
                        <View style={styles.resultSection}>
                            <View style={styles.resultCircle}>
                                <Text style={styles.resultLabel}>Monthly Return</Text>
                                <Text style={styles.resultValue}>
                                    ₪ {new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(monthlyReturn)}
                                </Text>
                                <Text style={styles.resultNote}>Estimated (25-30 years)</Text>
                            </View>
                        </View>

                        {/* info alert */}
                        <View style={styles.infoBox}>
                            <FeatherIcon name="info" size={16} color={theme.colors.textMuted} />
                            <Text style={styles.infoText}>
                                Based on 520 ₪ return for every 100k ₪ of mortgage.
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    flex: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
    },
    headerSubtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.fontFamily,
        marginTop: 4,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    section: {
        gap: 20,
        marginBottom: 30,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.fontFamily,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 16,
        height: 60,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
    },
    currency: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.textMuted,
        marginLeft: 8,
    },
    mortgageCard: {
        backgroundColor: theme.colors.surface,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        marginBottom: 30,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.fontFamily,
    },
    mortgageValue: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
    },
    resultSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    resultCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
        padding: 20,
    },
    resultLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    resultValue: {
        fontSize: 36,
        fontWeight: '900',
        color: theme.colors.white,
        fontFamily: theme.typography.fontFamily,
        textAlign: 'center',
    },
    resultNote: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 10,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 30,
        justifyContent: 'center',
        opacity: 0.6,
    },
    infoText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontFamily,
    },
})
