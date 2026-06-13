import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView, StyleSheet, View, Text, ScrollView,
  Pressable, TextInput, Alert, ActivityIndicator, Dimensions, BackHandler
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Header from '@/components/header';
import { DropdownPicker } from '@/components/dropdownPicker';
import api, { endpoints } from '@/app/api/axios';
import { TurmasAPI, type Turma } from '@/services/provas';
import { useGabaritos } from '@/context/GabaritosContext';

const { width: screenWidth } = Dimensions.get('window');

// Proporção do cameraFrame em relação à largura da tela
// cameraFrame tem width: '55%' e está centralizado dentro do cameraCard
// O cameraCard tem padding: 5 de cada lado
const CAMERA_CARD_PADDING = 40;
const CAMERA_FRAME_PCT = 0.40;

export default function ScannerScreen() {
  const router = useRouter();
  const { prova_id, nome_prova, quantidade_questoes } = useLocalSearchParams<{
    prova_id: string;
    nome_prova: string;
    quantidade_questoes: string;
  }>();

  const { gabaritos, loading: loadingGabaritos } = useGabaritos();

  const [permission, requestPermission] = useCameraPermissions();
  const [nomeAluno, setNomeAluno] = useState('');
  const [provaSelecionada, setProvaSelecionada] = useState<number | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<number | null>(null);

  // Gabarito atualmente selecionado (a partir do select ou do parâmetro de navegação)
  const provaAtual = gabaritos.find((g) => g.id === provaSelecionada) ?? null;
  const totalQuestoes = provaAtual?.quantidade_questoes ?? parseInt(quantidade_questoes ?? '24');
  const numColunas = Math.ceil(totalQuestoes / 24);
  const [loading, setLoading] = useState(false);
  const [colunaAtual, setColunaAtual] = useState(0);
  const [respostasAcumuladas, setRespostasAcumuladas] = useState<number[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const confirmarSaida = () => {
  // Se ainda está na primeira coluna e sem respostas, sai direto
  if (colunaAtual === 0 && respostasAcumuladas.length === 0) {
    resetarCorrecao();
    router.back();
    return;
  }

  Alert.alert(
    'Sair da correção?',
    `Você está na coluna ${colunaAtual + 1} de ${numColunas}. Sair agora vai apagar todo o progresso desta correção.`,
    [
      { text: 'Continuar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          resetarCorrecao();
          router.back();
        }
      },
    ]
  );
};

  // Pré-seleciona o gabarito: usa o parâmetro de navegação, ou o primeiro da lista
  useEffect(() => {
    if (provaSelecionada !== null) return;
    if (prova_id) {
      setProvaSelecionada(parseInt(prova_id));
    } else if (gabaritos.length > 0) {
      setProvaSelecionada(gabaritos[0].id);
    }
  }, [prova_id, gabaritos, provaSelecionada]);

  useEffect(() => {
    TurmasAPI.listar().then((dados) => {
      setTurmas(dados);
      if (dados.length > 0) setTurmaSelecionada(dados[0].id);
    }).catch(() => {
      Alert.alert('Erro', 'Não foi possível carregar as turmas.');
    });
  }, []);

  useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    confirmarSaida();
    return true; // impede a navegação padrão
  });
  return () => backHandler.remove();
}, [colunaAtual, respostasAcumuladas]);

  const resetarCorrecao = () => {
    setColunaAtual(0);
    setRespostasAcumuladas([]);
    setNomeAluno('');
  };

  // Troca o gabarito selecionado e zera qualquer progresso de scan em andamento
  const handleSelecionarProva = (value: string | number) => {
    setProvaSelecionada(Number(value));
    setColunaAtual(0);
    setRespostasAcumuladas([]);
  };

  const isUltimaColuna = colunaAtual === numColunas - 1;

  const handleProcessar = async () => {
    if (!nomeAluno.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do aluno antes de processar.');
      return;
    }
    if (!provaSelecionada) {
      Alert.alert('Gabarito obrigatório', 'Selecione um gabarito antes de processar.');
      return;
    }
    if (turmas.length > 0 && !turmaSelecionada) {
      Alert.alert('Aguarde', 'Carregando turma...');
      return;
    }
    if (turmas.length === 0) {
      Alert.alert('Turma indisponível', 'Nenhuma turma cadastrada disponível para correção.');
      return;
    }
    if (!cameraRef.current) {
      Alert.alert('Erro', 'Câmera não está pronta.');
      return;
    }

    try {
      setLoading(true);

      // 1. Captura a foto em qualidade máxima
      const foto = await cameraRef.current.takePictureAsync({
        quality: 1.0,
        base64: false,
      });

      if (!foto?.uri) {
        Alert.alert('Erro', 'Não foi possível capturar a imagem.');
        return;
      }

      // 2. Calcula o crop correspondente ao cameraFrame visível na tela
      // A câmera captura a largura total do sensor, mas o frame mostra apenas 70%
      // O frame está centralizado dentro do cameraCard (padding 16 de cada lado)
      const fotoWidth = foto.width;
      const fotoHeight = foto.height;

      // Largura útil do cameraCard (descontando padding)
      const cardWidth = screenWidth - CAMERA_CARD_PADDING * 2;

      // Largura do cameraFrame em pixels de tela
      const frameWidthTela = cardWidth * CAMERA_FRAME_PCT;

      // Margem de cada lado em pixels de tela
      const margemTela = (screenWidth - frameWidthTela) / 2;

      // Converte margem de pixels de tela para proporção da foto
      const margemProporcao = margemTela / screenWidth;

      // Aplica a proporção na largura real da foto
      const cropX = Math.floor(fotoWidth * margemProporcao);
      const cropWidth = Math.floor(fotoWidth * CAMERA_FRAME_PCT);

      // Garante que o crop não ultrapassa os limites da imagem
      const cropXSafe = Math.max(0, cropX);
      const cropWidthSafe = Math.min(cropWidth, fotoWidth - cropXSafe);

      // 3. Aplica o crop horizontal mantendo altura total
      const fotoCropada = await ImageManipulator.manipulateAsync(
        foto.uri,
        [{
          crop: {
            originX: cropXSafe,
            originY: 0,
            width: cropWidthSafe,
            height: fotoHeight,
          }
        }],
        { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 4. Monta o FormData com a foto cropada
      const form = new FormData();
      form.append('prova_id', String(provaSelecionada));
      form.append('coluna', String(colunaAtual));
      form.append('file', {
        uri: fotoCropada.uri,
        name: 'cartao.jpg',
        type: 'image/jpeg',
      } as any);

      // 5. Envia a coluna para o backend processar
      const res = await api.post(endpoints.gabaritosColuna, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const respostasColuna: number[] = res.data.respostas_coluna;
      const novasRespostas = [...respostasAcumuladas, ...respostasColuna];
      setRespostasAcumuladas(novasRespostas);

      if (isUltimaColuna) {
        // 6a. Última coluna — finaliza e salva nota
        const resFinalizacao = await api.post(endpoints.gabaritosFinalizar, {
          prova_id: provaSelecionada,
          nome_aluno: nomeAluno.trim(),
          id_turma: turmaSelecionada,
          respostas: novasRespostas,
        });

        const { resultado } = resFinalizacao.data;
        Alert.alert(
          'Correção concluída',
          `Aluno: ${nomeAluno}\nAcertos: ${resultado.acertos}/${resultado.total}\nNota: ${resultado.nota}`,
          [{ text: 'OK', onPress: () => {
            resetarCorrecao();
            router.back();
          }}]
        );
      } else {
        // 6b. Ainda há colunas — avança para a próxima
        setColunaAtual((prev) => prev + 1);
        Alert.alert(
          `Coluna ${colunaAtual + 1} de ${numColunas} concluída`,
          `Posicione a coluna ${colunaAtual + 2} e processe.`,
        );
      }

    } catch (err: any) {
      // console.log (em vez de console.error/warn) evita qualquer overlay do Expo/LogBox
      // sobre o Alert — o erro já é tratado e exibido ao usuário abaixo.
      console.log('Falha ao processar o cartão:', err?.response?.data?.mensagem ?? err?.message ?? err);
      Alert.alert('Erro', err?.response?.data?.mensagem ?? 'Erro ao processar o cartão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={provaAtual?.nome_prova ?? nome_prova ?? 'Escanear Cartão'}
        subtitle="Posicione o cartão e informe o aluno"
        brand={<HeaderBackButton onPress={() => {
          resetarCorrecao();
          router.back();
        }} />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Indicador de progresso */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            Coluna {colunaAtual + 1} de {numColunas}
          </Text>
          <View style={styles.progressBarContainer}>
            {Array.from({ length: numColunas }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  i < colunaAtual && styles.progressSegmentDone,
                  i === colunaAtual && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressSubtitle}>
            {isUltimaColuna
              ? 'Última coluna — após o scan a nota será calculada'
              : `Após o scan, posicione a coluna ${colunaAtual + 2}`}
          </Text>
        </View>

        {/* Formulário do aluno — só na primeira coluna */}
        {colunaAtual === 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Nome do aluno</Text>
            <TextInput
              value={nomeAluno}
              onChangeText={setNomeAluno}
              placeholder="Ex: Ana Silva"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Gabarito</Text>
            {loadingGabaritos && gabaritos.length === 0 ? (
              <View style={styles.hiddenNotice}>
                <Text style={styles.hiddenNoticeText}>Carregando gabaritos...</Text>
              </View>
            ) : gabaritos.length === 0 ? (
              <View style={styles.hiddenNotice}>
                <Text style={styles.hiddenNoticeText}>Nenhum gabarito cadastrado. Cadastre um gabarito antes de escanear.</Text>
              </View>
            ) : (
              <View style={styles.pickerWrapper}>
                <DropdownPicker
                  options={gabaritos.map((g) => ({
                    value: g.id,
                    label: g.nome_prova,
                    sublabel: `${g.quantidade_questoes} questões`,
                  }))}
                  selectedValue={provaSelecionada}
                  onSelect={handleSelecionarProva}
                  placeholder="Selecione o gabarito"
                />
              </View>
            )}

            {/* A seleção de turma foi removida da interface. A turma padrão será usada automaticamente quando disponível. */}
            {turmas.length === 0 && (
              <View style={styles.hiddenNotice}>
                <Text style={styles.hiddenNoticeText}>Aguarde: carregando turma padrão...</Text>
              </View>
            )}
          </View>
        )}

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

        {/* Botão principal */}
        <Pressable
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={handleProcessar}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryButtonText}>
                {isUltimaColuna ? 'Finalizar Correção' : `Processar Coluna ${colunaAtual + 1}`}
              </Text>
          }
        </Pressable>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 28, gap: 16 },
  progressCard: {
    width: '100%', borderRadius: 20, backgroundColor: '#FFFFFF',
    padding: 16, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
    alignItems: 'center', gap: 10,
  },
  progressTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  progressSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  progressBarContainer: { flexDirection: 'row', gap: 8, width: '100%' },
  progressSegment: {
    flex: 1, height: 8, borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  progressSegmentDone: { backgroundColor: '#A78BFA' },
  progressSegmentActive: { backgroundColor: '#7C3AED' },
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
  hiddenNotice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  hiddenNoticeText: {
    color: '#6B7280',
    fontSize: 13,
  },
  cameraCard: {
    width: '100%', borderRadius: 24, backgroundColor: '#FFFFFF',
    padding: 16, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  cameraFrame: {
    height: 580, width: '70%', alignSelf: 'center',
    borderRadius: 20, borderWidth: 1, borderStyle: 'dashed',
    borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', overflow: 'hidden',
  },
  cameraPreview: { ...StyleSheet.absoluteFillObject },
  cameraFallback: {
    height: 580, width: '70%', alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
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
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});