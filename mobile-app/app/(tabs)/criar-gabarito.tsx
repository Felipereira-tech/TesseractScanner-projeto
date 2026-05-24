import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Header from '@/components/header';
import { useGabaritos } from '@/context/GabaritosContext';

type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';

const ALTERNATIVAS: Alternativa[] = ['A', 'B', 'C', 'D', 'E'];
const MIN_QUESTOES = 50;
const MAX_QUESTOES = 90;
const DEFAULT_QUESTOES = 50;
const QUESTOES_OPTIONS = Array.from({ length: 5 }, (_, index) => 50 + (index * 10));

function createEmptyAnswers(total: number): Array<Alternativa | null> {
  return Array.from({ length: total }, () => null);
}

export default function CriarGabaritoScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const { addGabarito, updateGabarito, gabaritos } = useGabaritos();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nomeProva, setNomeProva] = useState('');
  const [descricaoProva, setDescricaoProva] = useState('');
  const [numeroQuestoes, setNumeroQuestoes] = useState(DEFAULT_QUESTOES);
  const [respostas, setRespostas] = useState<Array<Alternativa | null>>(createEmptyAnswers(DEFAULT_QUESTOES));

  const accentColor = '#7C3AED';

  useEffect(() => {
    if (numeroQuestoes <= 0) {
      setRespostas([]);
      return;
    }

    setRespostas((prev) => {
      if (prev.length === numeroQuestoes) {
        return prev;
      }

      if (prev.length > numeroQuestoes) {
        return prev.slice(0, numeroQuestoes);
      }

      return [...prev, ...createEmptyAnswers(numeroQuestoes - prev.length)];
    });
  }, [numeroQuestoes]);

  useEffect(() => {
    if (!editId) {
      setEditingId(null);
      return;
    }

    const gabaritoParaEditar = gabaritos.find((item) => item.id === editId);

    if (!gabaritoParaEditar) {
      setEditingId(null);
      return;
    }

    setEditingId(editId);
    setNomeProva(gabaritoParaEditar.titulo);
    setDescricaoProva(gabaritoParaEditar.descricao);
    setNumeroQuestoes(gabaritoParaEditar.questoes);
    setRespostas(gabaritoParaEditar.respostas);
  }, [editId, gabaritos]);

  const selectAlternativa = (index: number, alternativa: Alternativa) => {
    setRespostas((prev) => {
      const next = [...prev];
      next[index] = alternativa;
      return next;
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setNomeProva('');
    setDescricaoProva('');  
    setNumeroQuestoes(DEFAULT_QUESTOES);
    setRespostas(createEmptyAnswers(DEFAULT_QUESTOES));
  };

  const handleLimpar = () => {
    resetForm();
  };

  const handleAleatorio = () => {
    if (numeroQuestoes <= 0) {
      return;
    }

    setRespostas(
      Array.from({ length: numeroQuestoes }, () => ALTERNATIVAS[Math.floor(Math.random() * ALTERNATIVAS.length)])
    );
  };

  const handleSalvar = () => {
    const nomeTratado = nomeProva.trim();

    if (!nomeTratado) {
      Alert.alert('Nome obrigatorio', 'Informe o nome da prova antes de salvar.');
      return;
    }

    if (numeroQuestoes <= 0) {
      Alert.alert('Numero de questoes invalido', 'Defina pelo menos 1 questao.');
      return;
    }

    const temQuestaoSemResposta = respostas.some((resposta) => !resposta);

    if (temQuestaoSemResposta) {
      Alert.alert('Respostas incompletas', 'Selecione uma alternativa para cada questao.');
      return;
    }

    if (editingId) {
      updateGabarito(editingId, {
        titulo: nomeTratado,
        descricao: descricaoProva.trim() || `Gabarito com ${numeroQuestoes} questoes`,
        questoes: numeroQuestoes,
        respostas: respostas as Alternativa[],
      });

      resetForm();
      Alert.alert('Gabarito atualizado', `O gabarito "${nomeTratado}" foi atualizado.`, [
        { text: 'OK', onPress: () => router.replace('/gabaritos') },
      ]);
      return;
    }

    addGabarito({
      titulo: nomeTratado,
      descricao: descricaoProva.trim() || `Gabarito com ${numeroQuestoes} questoes`,
      questoes: numeroQuestoes,
      respostas: respostas as Alternativa[],
    });

    resetForm();
    Alert.alert('Gabarito salvo', `O gabarito "${nomeTratado}" foi salvo com sucesso.`, [
      { text: 'OK', onPress: () => router.replace('/gabaritos') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={editingId ? 'Editar Gabarito' : 'Criar Gabarito'}
        subtitle={editingId ? 'Altere os dados e salve as mudanças' : 'Preencha os dados e marque as respostas'}
        brand={<HeaderBackButton onPress={() => router.push('/gabaritos')} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informacoes do gabarito</Text>

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
            <Text style={styles.fieldLabel}>Descricao</Text>
            <TextInput
              value={descricaoProva}
              onChangeText={setDescricaoProva}
              placeholder="Ex: Gabarito do Simulado"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Numero de questoes</Text>
            <View style={styles.selectWrapper}>
              <Picker
                selectedValue={numeroQuestoes}
                onValueChange={(itemValue) => setNumeroQuestoes(Number(itemValue))}
                mode="dropdown"
                dropdownIconColor={accentColor}
                style={styles.select}
              >
                {QUESTOES_OPTIONS.map((quantidade) => (
                  <Picker.Item key={quantidade} label={`${quantidade} questoes`} value={quantidade} />
                ))}
              </Picker>
            </View>
            <Text style={styles.fieldHint}>Selecione entre {MIN_QUESTOES} e {MAX_QUESTOES} questoes.</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLimpar}>
            <Text style={styles.secondaryButtonText}>Limpar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, { borderColor: accentColor }]} onPress={handleAleatorio}>
            <Text style={[styles.secondaryButtonText, { color: accentColor }]}>Aleatorio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: accentColor }]} onPress={handleSalvar}>
            <Text style={styles.primaryButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Respostas por questao</Text>

          {numeroQuestoes <= 0 ? (
            <Text style={styles.emptyText}>Defina um numero de questoes para montar os subcards.</Text>
          ) : (
            <View style={styles.questionsGrid}>
              {respostas.map((resposta, index) => (
                <View key={`questao-${index + 1}`} style={styles.questionCard}>
                  <Text style={styles.questionTitle}>Questao {index + 1}</Text>
                  <View style={styles.alternativasRow}>
                    {ALTERNATIVAS.map((alternativa) => {
                      const selected = resposta === alternativa;

                      return (
                        <TouchableOpacity
                          key={`${index + 1}-${alternativa}`}
                          style={[
                            styles.alternativaButton,
                            selected && { backgroundColor: accentColor, borderColor: accentColor },
                          ]}
                          onPress={() => selectAlternativa(index, alternativa)}
                        >
                          <Text style={[styles.alternativaText, selected && styles.alternativaTextSelected]}>{alternativa}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 14,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 12,
  },
   emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  selectWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  select: {
    width: '100%',
  },
  fieldHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    width: '48.5%',
    backgroundColor: '#FBFDFF',
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  alternativasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  alternativaButton: {
    width: '30%',
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternativaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  alternativaTextSelected: {
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
