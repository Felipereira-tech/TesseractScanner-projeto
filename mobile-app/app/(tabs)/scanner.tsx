import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView, StyleSheet, View, Text, ScrollView,
  Pressable, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Picker } from '@react-native-picker/picker';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Header from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import api, { endpoints } from '@/app/api/axios';
import { TurmasAPI, type Turma } from '@/services/provas';

export default function ScannerScreen() {
  const router = useRouter();
  
  // Recupera os parâmetros globais passados para esta tela por meio da rota (ID e Nome da Prova)
  const { prova_id, nome_prova } = useLocalSearchParams<{ prova_id: string; nome_prova: string }>();
  
  // Hook do expo-camera para gerenciar o estado da permissão de acesso à câmera do dispositivo
  const [permission, requestPermission] = useCameraPermissions();
  
  // Estados locais para controle dos campos de entrada, listas e feedback de carregamento
  const [nomeAluno, setNomeAluno] = useState('');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Referência persistente apontada para o componente da Câmera para podermos disparar o gatilho de foto
  const cameraRef = useRef<CameraView>(null);

  // Executado uma única vez ao montar a tela: faz a requisição das turmas cadastradas para alimentar o Picker (Select)
  useEffect(() => {
    TurmasAPI.listar().then((dados) => {
      setTurmas(dados);
      // Pré-seleciona automaticamente a primeira turma da lista caso ela contenha dados
      if (dados.length > 0) setTurmaSelecionada(dados[0].id);
    }).catch(() => {
      Alert.alert('Erro', 'Não foi possível carregar as turmas.');
    });
  }, []);

  // Função principal disparada pelo botão, encarregada de capturar a foto e enviá-la para o backend
  const handleProcessar = async () => {
    // Validação preventiva: impede o envio caso o nome do aluno esteja em branco
    if (!nomeAluno.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do aluno antes de processar.');
      return;
    }

    // Validação preventiva: impede o envio caso nenhuma turma tenha sido carregada/selecionada
    if (!turmaSelecionada) {
      Alert.alert('Turma obrigatória', 'Selecione a turma do aluno antes de processar.');
      return;
    }

    // Validação preventiva: garante que a instância física da câmera está ativa e disponível
    if (!cameraRef.current) {
      Alert.alert('Erro', 'Câmera não está pronta.');
      return;
    }

    try {
      setLoading(true); // Ativa o sinalizador visual de carregamento (ActivityIndicator)

      // Comanda a câmera para capturar a fotografia em qualidade máxima
      const foto = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        base64: false, // Desabilitado porque vamos trafegar o arquivo direto via Multipart/FormData
      });

      // Valida se o arquivo de foto foi gerado corretamente em um diretório temporário local (URI)
      if (!foto?.uri) {
        Alert.alert('Erro', 'Não foi possível capturar a imagem.');
        return;
      }

      // Cria um objeto FormData para realizar o upload multipart (mistura de strings e arquivo binário)
      const form = new FormData();
      form.append('prova_id', String(prova_id));
      form.append('nome_aluno', nomeAluno.trim());
      form.append('id_turma', String(turmaSelecionada));
      // Injeta o arquivo da imagem apontando para a URI gerada pelo sistema de arquivos do dispositivo
      form.append('file', {
        uri: foto.uri,
        name: 'cartao.jpg',
        type: 'image/jpeg',
      } as any);

      // Despacha a requisição POST para a rota de correção (/api/gabaritos/corrigir) configurada no Axios
      const res = await api.post(endpoints.gabaritosCorrigir, form, {
        headers: { 'Content-Type': 'multipart/form-data' }, // Header mandatório para uploads de arquivos
      });

      // Extrai os dados calculados pelo backend FastAPI após o processamento do OpenCV
      const { resultado } = res.data;

      // Dispara um alerta de sucesso na tela exibindo o resumo do boletim do aluno corrigido
      Alert.alert(
        'Correção concluída',
        `Aluno: ${nomeAluno}\nAcertos: ${resultado.acertos}/${resultado.total}\nNota: ${resultado.nota}`,
      );

    } catch (err: any) {
      console.error(err);
      // Exibe a mensagem de erro customizada vinda do servidor ou uma mensagem estática genérica de fallback
      Alert.alert('Erro', err?.response?.data?.mensagem ?? 'Erro ao processar o cartão.');
    } finally {
      setLoading(false); // Desativa o sinalizador de carregamento liberando o botão para um novo clique
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Componente customizado de Cabeçalho com botão para retroceder à tela anterior */}
      <Header
        title={nome_prova ?? 'Escanear Cartão'}
        subtitle="Posicione o cartão e informe o aluno"
        brand={<HeaderBackButton onPress={() => router.back()} />}
      />

      {/* Container de Rolagem para evitar que teclados virtuais cubram os inputs em telas pequenas */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Bloco de Formulário de Identificação do Aluno */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Nome do aluno</Text>
          <TextInput
            value={nomeAluno}
            onChangeText={setNomeAluno}
            placeholder="Ex: Ana Silva"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Turma</Text>
          {/* Renderização Condicional: Exibe um spinner de loading caso a lista de turmas da API ainda esteja vazia */}
          {turmas.length === 0 ? (
            <ActivityIndicator color="#7C3AED" style={{ marginTop: 8 }} />
          ) : (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={turmaSelecionada}
                onValueChange={(v) => setTurmaSelecionada(v)}
                mode="dropdown"
                dropdownIconColor="#7C3AED"
                style={styles.picker}
              >
                {/* Mapeia dinamicamente o array de turmas transformando-as em opções selecionáveis */}
                {turmas.map((t) => (
                  <Picker.Item
                    key={t.id}
                    label={`${t.nome_turma} - ${t.ano_letivo}`}
                    value={t.id}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Bloco de Interface de Captura da Câmera */}
        <View style={styles.cameraCard}>
          <View style={styles.cameraFrame}>
            {/* Verifica se a permissão de uso da câmera já foi concedida pelo sistema operacional */}
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.cameraPreview} facing="back" />
            ) : (
              // Layout alternativo exibido caso a câmera esteja desativada ou aguardando permissões
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

        {/* Botão de Envio: Reduz a opacidade e se torna inativo (disabled) enquanto aguarda a resposta da API */}
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

        {/* Card Informativo com diretrizes operacionais para o professor */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Dica rápida</Text>
          <Text style={styles.tipText}>
            Centralize o cartão, evite sombras fortes e mantenha a folha bem visível para um scan mais preciso.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Folha de Estilos CSS-in-JS nativa do React Native
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
  pickerWrapper: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
    backgroundColor: '#FFFFFF', overflow: 'hidden',
  },
  picker: { width: '100%' },
  cameraCard: {
    width: '100%', borderRadius: 24, backgroundColor: '#FFFFFF',
    padding: 16, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  cameraFrame: {
    height: 580,
    width: '70%',
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  cameraPreview: { ...StyleSheet.absoluteFillObject },
  cameraFallback: {
    height: 580,
    width: '70%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
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