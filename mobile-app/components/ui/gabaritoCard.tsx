import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

type GabaritoCardProps = {
  titulo: string;
  descricao: string;
  questoes: number;
  data: string;
  onOptionsPress?: () => void;
};

export function GabaritoCard({ titulo, descricao, questoes, data, onOptionsPress }: GabaritoCardProps) {
  const iconColor = '#7C3AED';

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={onOptionsPress}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <IconSymbol name="ellipsis" size={18} color="#6B7280" />
      </TouchableOpacity>

      <View style={styles.icon}>
        <IconSymbol name="assignment.fill" size={30} color={iconColor} />
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
    </View>
  );
}

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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
});
