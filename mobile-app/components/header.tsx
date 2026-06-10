import type { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View, Text, Platform, StatusBar } from 'react-native';
import useResponsive from '@/hooks/useResponsive';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SPACING } from '@/constants/app';

type HeaderProps = {
  title: string;
  subtitle: string;
  brand?: ReactNode;
  rightAction?: ReactNode;
};

export default function Header({ title, subtitle, brand, rightAction }: HeaderProps) {
  const { moderateScale } = useResponsive();
  const styles = createStyles(moderateScale);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.brandContainer}>{brand}</View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.rightAction}>
        {rightAction}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (ms: (n:number)=>number) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ms(SPACING.md),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + ms(SPACING.md) : ms(SPACING.md),
    backgroundColor: COLORS.white,
  },
  brandContainer: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(BORDER_RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(SPACING.md),
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: ms(4),
  },
  title: {
    fontSize: ms(FONT_SIZES.xl),
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: ms(FONT_SIZES.sm),
    color: COLORS.text.secondary,
    marginTop: ms(2),
  },
  rightAction: {
    marginLeft: ms(SPACING.md),
  },
});