  import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
  import Header from '@/components/header';
  import { LinearGradient } from 'expo-linear-gradient';
  import { ScanLine, FileText, BarChart3, Settings, ListChecks, Activity } from 'lucide-react-native';
  import React, { act } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    brand: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: '#4f46e5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      color: '#1f2937',
    },
    primaryCard: {
      padding: 16,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    primaryTitle: {
      fontSize: 18,
      color: '#ffffff',
    },
    primarySubtitle: {
      fontSize: 15,
      color: '#ffffff',
    },
    primaryDesc: {
      color: '#ddd6fe',
      fontSize: 12,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: '#fff',
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 16,
    },
    cardTitle: {
      fontWeight: 'bold',
      fontSize: 16,
    },
    cardDesc: {
      fontSize: 12,
      color: '#6b7280',
    },
    iconLight: {
      backgroundColor: '#ede9fe',
      padding: 10,
      borderRadius: 999,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#f3f4f6',
      borderRadius: 8,
      marginBottom: 12,
    },
    actionText: {
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 12,
      color: '#374151',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gridCard: {
      margin: 20,
      width: '80%',
      padding: 30,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: 'center',
      backgroundColor: '#fff',

      borderWidth: 2,
      borderColor: '#d1d5db',
      borderStyle: 'solid',
    },
    iconBox: {
      backgroundColor: '#e0e7ff',
      padding: 10,
      borderRadius: 12,
    },
    gridTitle: {
      fontWeight: 'bold',
      marginTop: 6,
      textAlign: 'center',
      width: '100%',
    },
    gridDesc: {
        fontSize: 11,
        color: '#6b7280',
    },
    iconBoxGreen: {
      backgroundColor: '#d1fae5',
      padding: 10,
      borderRadius: 12,
    },
    iconBoxYelow: {
      backgroundColor: '#fef3c7',
      padding: 10,
      borderRadius: 12,
    },
    gridCardEmpty: {
      margin: 20,
      width: '80%',
      padding: 42,
      borderRadius: 16,
      marginBottom: 10,
      alignItems: 'center',
      backgroundColor: '#f3f4f6',

      borderWidth: 2,
      borderColor: '#d1d5db',
      borderStyle: 'solid',
    },
    plus: {
      fontSize: 24,
      color: '#9ca3af',
    },
    activityCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 12,
    },
    activityItem: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    activityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    activityTitle: {
      fontWeight: 'bold',
    },
    activityDesc: {
      fontSize: 12,
      color: '#6b7280',
    },

});

function ActivityItem({ icon, title, desc }: any) {
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>{icon}</View>

      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDesc}>{desc}</Text>
      </View>
    </View>
  );
}


  export default function HomeScreen({ navigation }: any) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LinearGradient
          colors={['#f5f3ff', '#ffffff', '#eef2ff']}
          style={{ flex: 1 }}
        >
          <Header
            title="ScanGab"
            subtitle="Correção de Gabaritos"
            brand={
              <View style={styles.brand}>
                <ScanLine color="#fff" size={18} />
              </View>
            }
          />
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Ações Rápidas</Text>

            <TouchableOpacity onPress={() => navigation.navigates('scanner')}>
                <LinearGradient colors={[ '#7c3aed', '#4f46e5' ]}
                  style={styles.primaryCard}>
                    <View>
                      <Text style={styles.primaryTitle}>Escanear Cartão</Text>
                      <Text style={styles.primarySubtitle}>Capture e corrija Respostas</Text>
                    </View>

                    <View style={styles.iconCircle}>
                      <ScanLine color='#ffffff' size={28} />
                    </View>
                  </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: 'transparent', marginVertical: 3 }} />

            <TouchableOpacity onPress={() => navigation.navigate('create-template')}>
              <View style={styles.card}>
                <View>
                  <Text style={styles.cardTitle}>Criar Gabarito</Text>
                  <Text style={styles.primaryDesc}>Configure as Resposta corretas
                    </Text>
                </View> 
              
                  <View style={styles.iconLight}>
                    <FileText color="#7c3aed" size={22}/>
                  </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Menus</Text>

              <View style={styles.grid}>
                
                <TouchableOpacity style={{ width: '50%' }}>
                  <View style={styles.gridCard}>
                    <View style={styles.iconBox}>
                      <ListChecks color="#4f46e5" size={24} />
                    </View>
                    <Text style={styles.gridTitle}>Gabaritos</Text>
                    <Text style={styles.gridDesc}>Ver todos</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={{ width: '50%' }}>
                  <View style={styles.gridCard}>
                    <View style={styles.iconBoxGreen}>
                      <BarChart3 color="#059669" size={24} />
                    </View>
                    <Text style={styles.gridTitle}>Estatísticas</Text>
                    <Text style={styles.gridDesc}>Análise</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={{ width: '50%' }}>
                  <View style={styles.gridCard}>
                    <View style={styles.iconBoxYelow}>
                      <Settings color="#d97706" size={24} />
                    </View>
                    <Text style={styles.gridTitle}>Configurações</Text>
                    <Text style={styles.gridDesc}>Ajustes</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={{ width: '50%' }}>
                  <View style={styles.gridCardEmpty}>
                    <Text style={styles.plus}>+</Text>
                    <Text style={styles.gridTitle}>Em breve</Text>
                    <Text style={styles.gridDesc}>Novidades</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>ATIVIDADE RECENTES</Text>
                <View style={styles.activityCard}>
                    <ActivityItem
                      icon={<ScanLine color="#16a34a" size={18} />}
                      title="Turma 8A - Matemática"
                      desc="15 alunos corrigidos • há 2 horas"
                    />
                    
                    <ActivityItem
                      icon={<FileText color="#2563eb" size={18} />}
                      title="Prova de História"
                      desc="Gabarito criado • há 1 dia"
                    />

                    <ActivityItem
                      icon={<ScanLine color="#7c3aed" size={18} />}
                      title="Turma 7B - Português"
                      desc="23 alunos corrigidos • há 3 dias"
                    />
                  </View>

          </ScrollView>

          <StatusBar style='auto' hidden={true}/>
        
        </LinearGradient>
      </SafeAreaView>
    );
  }