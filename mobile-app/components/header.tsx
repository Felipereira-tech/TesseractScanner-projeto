import type { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View, Text, Platform, StatusBar } from 'react-native';

type HeaderProps = {
  title: string;
  subtitle: string;
  brand?: ReactNode;
  rightAction?: ReactNode;
};

export default function Header({ title, subtitle, brand, rightAction }: HeaderProps) {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 10,
    backgroundColor: 'white',
  },
  brandContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rightAction: {
    marginLeft: 10,
  },
});