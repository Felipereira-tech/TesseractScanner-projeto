import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Header from '@/components/header';
import { useGabaritos } from '@/context/GabaritosContext';
import { ProvasAPI } from '@/services/provas';

type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';

const ALTERNATIVAS: Alternativa[] = ['A', 'B', 'C', 'D', 'E'];
const DEFAULT_QUESTOES = 50;
const MIN_QUESTOES = 50;
const MAX_QUESTOES = 90;
const QUESTOES_OPTIONS = Array.from({ length: 5 }, (_, i) => 50 + i * 10);

function createEmptyAnswers(total: number): Array<Alternativa | null> {
  return Array.from({ length: total }, () => null);
}

export default function CriarGabaritoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    nome_prova?: string;
    descricao?: string;
    quantidade_questoes?: string;
    respostas?: string;
  }>();
  const { addGabarito, updateGabarito } = useGabaritos();

  const [salvando, setSalvando] = useState(false);
  const [nomeProva, setNomeProva] = useState('');
  const [descricaoProva, setDescricaoProva] = useState('');
  const [numeroQuestoes, setNumeroQuestoes] = useState(DEFAULT_QUESTOES);
  const [respostas, setRespostas] = useState<Array<Alternativa | null>>(createEmptyAnswers(DEFAULT_QUESTOES));
  const [provaId, setProvaId] = useState<number | null>(null);
  const isEditing = Boolean(params?.id);

  const accentColor = '#7C3AED';

  useEffect(() => {
    if (params?.id) {
      setProvaId(Number(params.id));
      setNomeProva(params.nome_prova ?? '');
      setDescricaoProva(params.descricao ?? '');
      const qtd = Number(params.quantidade_questoes ?? DEFAULT_QUESTOES);
      setNumeroQuestoes(qtd);

      // Tenta carregar respostas dos params primeiro
      if (params.respostas && params.respostas.length > 0) {
        try {
          const respostaLista = params.respostas
            .split(',')
            .map((item) => item.trim().toUpperCase())
            .filter((item) => ALTERNATIVAS.includes(item as Alternativa)) as Alternativa[];
          
          // Preenche o resto com null se necessário
          if (respostaLista.length < qtd) {
            setRespostas([...respostaLista, ...createEmptyAnswers(qtd - respostaLista.length)]);
          } else {
            setRespostas(respostaLista.slice(0, qtd));
          }
          return; // Se conseguiu dos params, não busca do backend
        } catch (err) {
          console.warn('Erro ao parsear respostas:', err);
        }
      }

      // Se não encontrou nos params ou falhou, busca do backend
      ProvasAPI.buscarGabarito(Number(params.id))
        .then((g) => {
          if (g && g.respostas) {
            const mapped = (g.respostas as Array<any>).map((r) => {
              if (typeof r === 'number') return ALTERNATIVAS[r] ?? null;
              if (typeof r === 'string') {
                const up = r.trim().toUpperCase();
                if (ALTERNATIVAS.includes(up as Alternativa)) return up as Alternativa;
                if (!isNaN(Number(r))) return ALTERNATIVAS[Number(r)] ?? null;
              }
              return null;
            });

            if (mapped.length === qtd) {
              setRespostas(mapped as Array<Alternativa | null>);
            } else if (mapped.length > qtd) {
              setRespostas((mapped as Array<Alternativa | null>).slice(0, qtd));
            } else {
              setRespostas([...(mapped as Array<Alternativa | null>), ...createEmptyAnswers(qtd - mapped.length)]);
            }
          }
        })
        .catch((err) => {
          console.warn('Não foi possível buscar gabarito:', err);
        });
    }
  }, [params?.id]); // Só depende do ID para evitar re-runs

  useEffect(() => {
    // Ajusta tamanho das respostas quando numeroQuestoes muda, mas só se não estiver editando
    if (!isEditing && numeroQuestoes > 0) {
      setRespostas((prev) => {
        if (prev.length === numeroQuestoes) return prev;
        if (prev.length > numeroQuestoes) return prev.slice(0, numeroQuestoes);
        return [...prev, ...createEmptyAnswers(numeroQuestoes - prev.length)];
      });
    }
  }, [numeroQuestoes, isEditing]);

  const selectAlternativa = (index: number, alternativa: Alternativa) => {
    setRespostas((prev) => {
      const next = [...prev];
      next[index] = alternativa;
      return next;
    });
  };

  const resetForm = () => {
    setNomeProva('');
    setDescricaoProva('');
    setNumeroQuestoes(DEFAULT_QUESTOES);
    setRespostas(createEmptyAnswers(DEFAULT_QUESTOES));
  };

  const handleAleatorio = () => {
    setRespostas(
      Array.from({ length: numeroQuestoes }, () =>
        ALTERNATIVAS[Math.floor(Math.random() * ALTERNATIVAS.length)]
      )
    );
  };

  // PONTO CRÍTICO: agora é async
  const handleSalvar = async () => {
    const nomeTratado = nomeProva.trim();

    if (!nomeTratado) {
      Alert.alert('Nome obrigatório', 'Informe o nome da prova antes de salvar.');
      return;
    }

    if (numeroQuestoes <= 0) {
      Alert.alert('Número de questões inválido', 'Defina pelo menos 1 questão.');
      return;
    }

    if (respostas.some((r) => !r)) {
      Alert.alert('Respostas incompletas', 'Selecione uma alternativa para cada questão.');
      return;
    }

    try {
      setSalvando(true);

      if (isEditing && provaId) {
        await updateGabarito(provaId, {
          titulo: nomeTratado,
          descricao: descricaoProva.trim() || `Gabarito com ${numeroQuestoes} questões`,
          questoes: numeroQuestoes,
          respostas: respostas as Alternativa[],
        });
        Alert.alert('Gabarito atualizado', `O gabarito "${nomeTratado}" foi atualizado com sucesso.`, [
          { text: 'OK', onPress: () => router.replace('/gabaritos') },
        ]);
      } else {
        await addGabarito({
          titulo: nomeTratado,
          descricao: descricaoProva.trim() || `Gabarito com ${numeroQuestoes} questões`,
          questoes: numeroQuestoes,
          respostas: respostas as Alternativa[],
        });
        resetForm();
        Alert.alert('Gabarito salvo', `O gabarito "${nomeTratado}" foi salvo com sucesso.`, [
          { text: 'OK', onPress: () => router.replace('/gabaritos') },
        ]);
      }
    } catch (err: any) {
      Alert.alert(
        'Erro ao salvar',
        err?.response?.data?.mensagem ?? 'Não foi possível salvar o gabarito. Verifique sua conexão.'
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditing ? 'Editar Gabarito' : 'Criar Gabarito'}
        subtitle="Preencha os dados e marque as respostas"
        brand={<HeaderBackButton onPress={() => router.push('/gabaritos')} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações do gabarito</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nome da prova</Text>
            <TextInput
              value={nomeProva}
              onChangeText={setNomeProva}
              placeholder="Ex: Simulado ENEM 2026"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              value={descricaoProva}
              onChangeText={setDescricaoProva}
              placeholder="Ex: Gabarito do Simulado"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Número de questões</Text>
            <View style={styles.selectWrapper}>
              <Picker
                selectedValue={numeroQuestoes}
                onValueChange={(v) => setNumeroQuestoes(Number(v))}
                mode="dropdown"
                dropdownIconColor={accentColor}
                style={styles.select}
              >
                {QUESTOES_OPTIONS.map((q) => (
                  <Picker.Item key={q} label={`${q} questões`} value={q} />
                ))}
              </Picker>
            </View>
            <Text style={styles.fieldHint}>
              Selecione entre {MIN_QUESTOES} e {MAX_QUESTOES} questões.
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetForm} disabled={salvando}>
            <Text style={styles.secondaryButtonText}>Limpar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: accentColor }]}
            onPress={handleAleatorio}
            disabled={salvando}
          >
            <Text style={[styles.secondaryButtonText, { color: accentColor }]}>Aleatório</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accentColor, opacity: salvando ? 0.6 : 1 }]}
            onPress={handleSalvar}
            disabled={salvando}
          >
            {salvando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>Salvar</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Respostas por questão</Text>

          {numeroQuestoes <= 0 ? (
            <Text style={styles.emptyText}>Defina um número de questões para montar os subcards.</Text>
          ) : (
            <View style={styles.questionsList}>
              {respostas.map((resposta, index) => (
                <View key={`questao-${index + 1}`} style={styles.questionCard}>
                  <Text style={styles.questionTitle}>Questão {index + 1}</Text>
                  <View style={styles.alternativasList}>
                    {ALTERNATIVAS.map((alt) => {
                      const selected = resposta === alt;
                      return (
                        <TouchableOpacity
                          key={`${index}-${alt}`}
                          style={[
                            styles.alternativaButton,
                            selected && { backgroundColor: accentColor, borderColor: accentColor },
                          ]}
                          onPress={() => selectAlternativa(index, alt)}
                          disabled={salvando}
                        >
                          <Text style={[styles.alternativaText, selected && styles.alternativaTextSelected]}>
                            {alt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 14 },
  card: {
    width: '100%', borderRadius: 20, backgroundColor: '#FFFFFF', padding: 16,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 14 },
  fieldGroup: { marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', paddingHorizontal: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#111827',
  },
  selectWrapper: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
    backgroundColor: '#FFFFFF', overflow: 'hidden',
  },
  select: { width: '100%' },
  fieldHint: { marginTop: 6, fontSize: 12, color: '#6B7280' },
  questionsList: { flexDirection: 'column', gap: 10 },
  questionCard: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14,
    padding: 12, width: '100%', backgroundColor: '#FBFDFF',
  },
  questionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  alternativasList: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  alternativaButton: {
    flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1,
    borderColor: '#CBD5E1', backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10,
  },
  alternativaText: { fontSize: 14, fontWeight: '800', color: '#475569' },
  alternativaTextSelected: { color: '#FFFFFF' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10 },
  secondaryButton: {
    flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF', paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryButtonText: { color: '#374151', fontWeight: '700', fontSize: 14 },
  primaryButton: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});