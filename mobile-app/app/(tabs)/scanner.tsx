import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Picker } from '@react-native-picker/picker';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';

import Header from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getDisciplinaIconColor, type Disciplina } from '@/constants/disciplinas';

const DISCIPLINAS: Array<{ label: string; value: Disciplina }> = [
  { label: 'Matemática', value: 'matematica' },
  { label: 'Português', value: 'portugues' },
  { label: 'História', value: 'historia' },
  { label: 'Geografia', value: 'geografia' },
  { label: 'Ciências', value: 'ciencias' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDiscipline, setSelectedDiscipline] = useState<Disciplina>('matematica');
  const [permission, requestPermission] = useCameraPermissions();

  const accentColor = useMemo(() => getDisciplinaIconColor(selectedDiscipline), [selectedDiscipline]);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Escanear Cartão"
        subtitle="Selecione a matéria e inicie a leitura"
        brand={<HeaderBackButton onPress={() => router.back()} />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Selecione o Gabrito</Text>
            <View style={[styles.pickerWrapper, { borderColor: `${accentColor}33` }]}>
              <Picker
                selectedValue={selectedDiscipline}
                onValueChange={(itemValue) => setSelectedDiscipline(itemValue)}
                mode="dropdown"
                dropdownIconColor={accentColor}
                style={styles.picker}
              >
                {DISCIPLINAS.map((discipline) => (
                  <Picker.Item key={discipline.value} label={discipline.label} value={discipline.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.cameraCard}>
          <View style={[styles.cameraFrame, { borderColor: `${accentColor}33` }]}>
            {permission?.granted ? (
              <>
                <CameraView style={styles.cameraPreview} facing="back" />

              </>
            ) : (
              <View style={styles.cameraFallback}>
                <IconSymbol name="description" size={34} color={accentColor} />
                <Text style={styles.cameraTitle}>{permission ? 'Permissão da câmera necessária' : 'Ativando câmera...'}</Text>
                <Text style={styles.cameraSubtitle}>
                  {permission
                    ? 'Permita o acesso para visualizar a câmera e escanear o gabarito.'
                    : 'Solicitando acesso à câmera para iniciar o preview.'}
                </Text>

                {permission && !permission.granted ? (
                  <Pressable style={[styles.permissionButton, { backgroundColor: accentColor }]} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Permitir câmera</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Dica rápida</Text>
          <Text style={styles.tipText}>
            Centralize o cartão, evite sombras fortes e mantenha a folha bem visível para um scan mais preciso.
          </Text>
        </View>

        <Pressable style={[styles.primaryButton, { backgroundColor: accentColor }]} onPress={() => {}}>
          <Text style={styles.primaryButtonText}>Processar Scan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 16,
  },
  heroCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 10,
  },
  section: {
    gap: 10,
    width: '100%',
    marginTop: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pickerWrapper: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  picker: {
    width: '100%',
  },
  cameraCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cameraFrame: {
    minHeight: 230,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.08)',
  },
  cameraOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  cameraOverlayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cameraFallback: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 14,
    textAlign: 'center',
  },
  cameraSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tipCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    padding: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#3730A3',
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
