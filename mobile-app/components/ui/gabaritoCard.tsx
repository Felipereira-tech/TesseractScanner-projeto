/* gabaritoCard.tsx */

import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import useResponsive from '@/hooks/useResponsive';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS } from '@/constants/app';

import { IconSymbol } from '@/components/ui/icon-symbol';

type GabaritoCardProps = {
  titulo: string;
  descricao: string;
  questoes: number;
  data: string;
  onPress?: () => void; 
  onOptionsPress?: () => void;
};



export function GabaritoCard({ titulo, descricao, questoes, data, onPress, onOptionsPress }: GabaritoCardProps) {
  const { moderateScale: ms } = useResponsive();
  const styles = createStyles(ms);
  const iconColor = COLORS.primary;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardContentWrapper} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.icon}>
          <IconSymbol name="assignment.fill" size={ms(30)} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{titulo}</Text>
          </View>

          <Text style={styles.cardDescription}>{descricao}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{questoes} Questoes</Text>
            </View>
            <Text style={styles.footerDate}>{data}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionsButton}
        onPress={onOptionsPress}
        hitSlop={{ top: ms(12), right: ms(12), bottom: ms(12), left: ms(12) }}
      >
        <IconSymbol name="ellipsis" size={ms(20)} color={COLORS.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (ms: (n:number)=>number) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderColor: '#E6EAF2',
    borderWidth: 1,
    width: '100%',
    padding: ms(SPACING.lg),
    gap: ms(14),
    borderRadius: ms(BORDER_RADIUS.xl),
    ...SHADOWS.sm,
    position: 'relative',
  },
  cardContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 0,
  },
  cardHeader: {
    marginBottom: ms(6),
  },
  cardFooter: {
    marginTop: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: ms(50),
    height: ms(50),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: ms(BORDER_RADIUS.md),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: ms(FONT_SIZES.md),
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  cardDescription: {
    color: COLORS.text.secondary,
    fontSize: ms(FONT_SIZES.sm),
    lineHeight: ms(20),
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    borderWidth: 1,
    borderRadius: 999,
    borderColor: '#93C5FD',
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    color: '#1E3A8A',
    fontSize: ms(12),
    fontWeight: '600',
  },
  footerDate: {
    color: '#9CA3AF',
    fontSize: ms(12),
    fontWeight: '500',
  },
  optionsButton: {
    position: 'absolute',
    top: ms(10),
    right: ms(10),
    width: ms(34),
    height: ms(34),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#E6EAF2',
    borderWidth: 1,
    width: '100%',
    padding: 16,
    gap: 14,
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  cardContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 0,
  },
  cardHeader: {
    marginBottom: 6,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  cardDescription: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: '#93C5FD',
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '600',
  },
  footerDate: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  optionsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
});
