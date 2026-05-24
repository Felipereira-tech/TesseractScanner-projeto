import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Header from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import api, { endpoints } from '@/app/api/axios';

export default function ScannerScreen() {
  const router = useRouter();
  const { prova_id, nome_prova } = useLocalSearchParams<{ prova_id: string; nome_prova: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [nomeAluno, setNomeAluno] = useState('');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleProcessar = async () => {
    if (!nomeAluno.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do aluno antes de processar.');
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Erro', 'Câmera não está pronta.');
      return;
    }

    try {
      setLoading(true);

      // 1. Captura a foto
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!foto?.uri) {
        Alert.alert('Erro', 'Não foi possível capturar a imagem.');
        return;
      }

      // 2. Monta o FormData
      const form = new FormData();
      form.append('prova_id', String(prova_id));
      form.append('nome_aluno', nomeAluno.trim());
      form.append('id_turma', '1'); // ajuste conforme seu fluxo
      form.append('file', {
        uri: foto.uri,
        name: 'cartao.jpg',
        type: 'image/jpeg',
      } as any);

      // 3. Envia ao backend
      const res = await api.post(endpoints.gabaritosCorrigir, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { resultado, respostas_lidas, preview_correcao } = res.data;

      // 4. Navega para tela de resultado
      Alert.alert(
        'Correção concluída',
        `Aluno: ${nomeAluno}\nAcertos: ${resultado.acertos}/${resultado.total}\nNota: ${resultado.nota}`,
      );

    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro', err?.response?.data?.mensagem ?? 'Erro ao processar o cartão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={nome_prova ?? 'Escanear Cartão'}
        subtitle="Posicione o cartão e informe o aluno"
        brand={<HeaderBackButton onPress={() => router.back()} />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Campo nome do aluno */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Nome do aluno</Text>
          <TextInput
            value={nomeAluno}
            onChangeText={setNomeAluno}
            placeholder="Ex: Ana Silva"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>

        {/* Câmera */}
        <View style={styles.cameraCard}>
          <View style={styles.cameraFrame}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
            ) : (
              <View style={styles.cameraFallback}>
                <IconSymbol name="description" size={34} color="#7C3AED" />
                <Text style={styles.cameraTitle}>
                  {permission ? 'Permissão necessária' : 'Ativando câmera...'}
                </Text>
                {permission && !permission.granted && (
                  <Pressable style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Permitir câmera</Text>
                  </Pressable>
                )}
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

        <Pressable
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={handleProcessar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryButtonText}>Processar Scan</Text>
          }
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 28, gap: 16 },
  card: {
    width: '100%', borderRadius: 24, backgroundColor: '#FFFFFF',
    padding: 20, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  cameraCard: {
    width: '100%', borderRadius: 24, backgroundColor: '#FFFFFF',
    padding: 16, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  cameraFrame: {
    minHeight: 300, borderRadius: 20, borderWidth: 1,
    borderStyle: 'dashed', borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB', overflow: 'hidden',
  },
  cameraPreview: { ...StyleSheet.absoluteFillObject },
  cameraFallback: {
    minHeight: 300, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 24,
  },
  cameraTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 14, textAlign: 'center' },
  permissionButton: { marginTop: 14, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#7C3AED' },
  permissionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  tipCard: { width: '100%', borderRadius: 20, backgroundColor: '#EEF2FF', padding: 16 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#1E3A8A', marginBottom: 6 },
  tipText: { fontSize: 14, color: '#3730A3', lineHeight: 20 },
  primaryButton: {
    width: '100%', borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7C3AED', shadowColor: '#000',
    shadowOpacity: 0.12, shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});