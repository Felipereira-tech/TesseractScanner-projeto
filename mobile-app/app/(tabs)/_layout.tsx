import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Componente de layout principal para a pasta (tabs).
// Ele define a navegação em abas do aplicativo e o ícone de cada aba visível.
export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Seleciona o esquema de cores atual para usar no estilo da aba ativa.
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          // Renderiza o ícone da aba Home usando o painel de ícones.
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="gabaritos"
        options={{
          title: 'Gabaritos',
          // Renderiza o ícone da aba Gabaritos.
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="assignment.fill" color={color} />
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          // Tela de scanner não aparece como aba visível.
          href: null,
        }}
      />
      <Tabs.Screen
        name="criar-gabarito"
        options={{
          // Tela de criar gabarito não aparece como aba visível.
          href: null,
        }}
      />

    </Tabs>

  );
}
