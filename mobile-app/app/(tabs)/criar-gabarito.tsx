import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Header from '@/components/header';
import useResponsive from '@/hooks/useResponsive';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/app';
import { useGabaritos } from '@/context/GabaritosContext';
import { ProvasAPI } from '@/services/provas';
import { DropdownPicker, DropdownOption } from '@/components/dropdownPicker';
import { IconSymbol } from '@/components/ui/icon-symbol';

type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';

const ALTERNATIVAS: Alternativa[] = ['A', 'B', 'C', 'D', 'E'];
const DEFAULT_QUESTOES = 50;
const MIN_QUESTOES = 50;
const MAX_QUESTOES = 90;
const QUESTOES_OPTIONS = Array.from({ length: 5 }, (_, i) => 50 + i * 10);

// Cada opção de quantidade com ícone, sublabel e badge
const QUESTOES_DROPDOWN: DropdownOption[] = QUESTOES_OPTIONS.map((q) => ({
  value: q,
  label: `${q} questões`,
  sublabel: q === 50 ? 'Mínimo permitido' : q === 90 ? 'Máximo permitido' : `Gabarito intermediário`,
  icon: <IconSymbol name="doc.text" size={18} color="#7C3AED" />,
  badge: q === 50 ? 'Padrão' : q === 90 ? 'Completo' : undefined,
  badgeBg: q === 50 ? '#E1F5EE' : '#EEEDFE',
  badgeColor: q === 50 ? '#0F6E56' : '#534AB7',
}));

function createEmptyAnswers(total: number): Array<Alternativa | null> {
  return Array.from({ length: total }, () => null);
}

export default function CriarGabaritoScreen() {
  const router = useRouter();
  const { moderateScale: ms } = useResponsive();
  const params = useLocalSearchParams<{
    id?: string;
    nome_prova?: string;
    descricao?: string;
    quantidade_questoes?: string;
    respostas?: string;
  }>();
  const { addGabarito, updateGabarito } = useGabaritos();

  const [salvando, setSalvando] = useState(false);
  const [carregandoGabarito, setCarregandoGabarito] = useState(false);
  const [nomeProva, setNomeProva] = useState('');
  const [descricaoProva, setDescricaoProva] = useState('');
  const [numeroQuestoes, setNumeroQuestoes] = useState(DEFAULT_QUESTOES);
  const [respostas, setRespostas] = useState<Array<Alternativa | null>>(createEmptyAnswers(DEFAULT_QUESTOES));
  const [provaId, setProvaId] = useState<number | null>(null);
  const salvarClickedRef = useRef(false);

  const provaIdParam = params?.id ? Number(params.id) : null;
  const isEditing = Boolean(provaIdParam);

  const accentColor = '#7C3AED';

  useEffect(() => {
    if (!provaIdParam) return;

    const id = provaIdParam;
    setProvaId(id);

    const nome = params.nome_prova ? decodeURIComponent(String(params.nome_prova)) : '';
    const descricao = params.descricao ? decodeURIComponent(String(params.descricao)) : '';
    const qtd = Number(params.quantidade_questoes ?? DEFAULT_QUESTOES);

    setNomeProva(nome);
    setDescricaoProva(descricao);
    setNumeroQuestoes(qtd);

    const loadGabarito = async () => {
      setCarregandoGabarito(true);
      try {
        const g = await ProvasAPI.buscarGabarito(id);
        const backendRespostas = Array.isArray(g?.respostas) ? (g.respostas as Array<string | number>) : [];
        const backendQuantidadeQuestoes = typeof g?.quantidade_questoes === 'number' ? g.quantidade_questoes : qtd;
        const totalQuestoes = backendQuantidadeQuestoes;

        setNumeroQuestoes(totalQuestoes);

        const mapped = backendRespostas.map((r: string | number) => {
          if (typeof r === 'number') return ALTERNATIVAS[r] ?? null;
          if (typeof r === 'string') {
            const up = r.trim().toUpperCase();
            if (ALTERNATIVAS.includes(up as Alternativa)) return up as Alternativa;
            if (!isNaN(Number(r))) return ALTERNATIVAS[Number(r)] ?? null;
          }
          return null;
        });

        if (mapped.length === totalQuestoes) {
          setRespostas(mapped as Array<Alternativa | null>);
        } else if (mapped.length > totalQuestoes) {
          setRespostas((mapped as Array<Alternativa | null>).slice(0, totalQuestoes));
        } else {
          setRespostas([...(mapped as Array<Alternativa | null>), ...createEmptyAnswers(totalQuestoes - mapped.length)]);
        }

        if (backendRespostas.length === 0 && params.respostas && String(params.respostas).length > 0) {
          try {
            const raw = typeof params.respostas === 'string'
              ? decodeURIComponent(params.respostas)
              : String(params.respostas);
            const respostaLista = raw
              .split(',')
              .map((item) => item.trim().toUpperCase())
              .filter((item) => ALTERNATIVAS.includes(item as Alternativa)) as Alternativa[];

            if (respostaLista.length > 0) {
              if (respostaLista.length < totalQuestoes) {
                setRespostas([...respostaLista, ...createEmptyAnswers(totalQuestoes - respostaLista.length)]);
              } else {
                setRespostas(respostaLista.slice(0, totalQuestoes));
              }
            }
          } catch (err) {
            console.warn('[Edição] Erro ao parsear respostas dos params:', err);
          }
        }
      } catch (err) {
        console.warn('[Edição] Erro ao buscar gabarito do backend:', err);
      } finally {
        setCarregandoGabarito(false);
      }
    };

    loadGabarito();
  }, [provaIdParam]);

  useEffect(() => {
    if (numeroQuestoes <= 0) return;
    setRespostas((prev) => {
      if (prev.length === numeroQuestoes) return prev;
      if (prev.length > numeroQuestoes) return prev.slice(0, numeroQuestoes);
      return [...prev, ...createEmptyAnswers(numeroQuestoes - prev.length)];
    });
  }, [numeroQuestoes]);

  const selectAlternativa = (index: number, alternativa: Alternativa) => {
    setRespostas((prev) => {
      const next = [...prev];
      next[index] = alternativa;
      return next;
    });
  };

  const resetForm = () => {
    if (isEditing) {
      Alert.alert('Aviso', 'Você está em modo edição. Não é possível limpar o formulário nesta tela.');
      return;
    }
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

  const handleSalvar = async () => {
    if (salvarClickedRef.current) return;
    salvarClickedRef.current = true;

    const nomeTratado = nomeProva.trim();

    if (!nomeTratado) {
      salvarClickedRef.current = false;
      Alert.alert('Nome obrigatório', 'Informe o nome da prova antes de salvar.');
      return;
    }

    if (numeroQuestoes <= 0) {
      salvarClickedRef.current = false;
      Alert.alert('Número de questões inválido', 'Defina pelo menos 1 questão.');
      return;
    }

    if (respostas.some((r) => !r)) {
      salvarClickedRef.current = false;
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
      const mensagemErro = err?.response?.data?.mensagem ?? err?.message ?? 'Não foi possível salvar o gabarito.';
      Alert.alert('Erro ao salvar', mensagemErro);
    } finally {
      setSalvando(false);
      salvarClickedRef.current = false;
    }
  };

  const styles = createStyles(ms);
  const isFormDisabled = salvando || carregandoGabarito;
  const screenTitle = isEditing ? 'Editar Gabarito' : 'Criar Gabarito';
  const screenSubtitle = isEditing
    ? 'Atualize os dados e as respostas do gabarito'
    : 'Preencha os dados e marque as respostas';
  const saveLabel = isEditing ? 'Salvar alterações' : 'Salvar';

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={screenTitle}
        subtitle={screenSubtitle}
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
              <DropdownPicker
                options={QUESTOES_DROPDOWN}
                selectedValue={numeroQuestoes}
                onSelect={(value) => setNumeroQuestoes(Number(value))}
                placeholder="Selecione o número de questões"
              />
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
            style={[styles.primaryButton, { backgroundColor: accentColor, opacity: isFormDisabled ? 0.6 : 1 }]}
            onPress={handleSalvar}
            disabled={isFormDisabled}
          >
            {isFormDisabled
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryButtonText}>{saveLabel}</Text>
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

const createStyles = (ms: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: ms(SPACING.lg),
    paddingTop: ms(SPACING.lg),
    paddingBottom: ms(SPACING.xxl),
    gap: ms(SPACING.md),
  },
  card: {
    width: '100%',
    borderRadius: ms(BORDER_RADIUS.xxl),
    backgroundColor: COLORS.white,
    padding: ms(SPACING.lg),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: ms(14),
    shadowOffset: { width: 0, height: ms(6) },
    elevation: 4,
  },
  cardTitle: { fontSize: ms(FONT_SIZES.md), fontWeight: '800', color: COLORS.text.primary, marginBottom: ms(SPACING.md) },
  fieldGroup: { marginBottom: ms(SPACING.md) },
  fieldLabel: { fontSize: ms(FONT_SIZES.sm), fontWeight: '700', color: COLORS.text.primary, marginBottom: ms(8) },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: ms(BORDER_RADIUS.md),
    backgroundColor: COLORS.white,
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
    fontSize: ms(FONT_SIZES.sm),
    color: COLORS.text.primary,
  },
  selectWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: ms(BORDER_RADIUS.md),
    backgroundColor: COLORS.white,
  },
  fieldHint: { marginTop: ms(6), fontSize: ms(FONT_SIZES.xs), color: COLORS.text.secondary },
  emptyText: { fontSize: ms(FONT_SIZES.md), color: COLORS.text.tertiary, textAlign: 'center', paddingHorizontal: ms(SPACING.lg) },
  questionsList: { flexDirection: 'column', gap: ms(10) },
  questionCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: ms(BORDER_RADIUS.md),
    padding: ms(12),
    width: '100%',
    backgroundColor: '#FBFDFF',
  },
  questionTitle: { fontSize: ms(FONT_SIZES.sm), fontWeight: '700', color: COLORS.text.primary, marginBottom: ms(10) },
  alternativasList: { flexDirection: 'row', gap: ms(6), justifyContent: 'space-between' },
  alternativaButton: {
    flex: 1,
    minHeight: ms(44),
    borderRadius: ms(BORDER_RADIUS.md),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(10),
  },
  alternativaText: { fontSize: ms(FONT_SIZES.sm), fontWeight: '800', color: '#475569' },
  alternativaTextSelected: { color: COLORS.white },
  actionsRow: { flexDirection: 'row', gap: ms(10), marginTop: ms(4), marginBottom: ms(10) },
  secondaryButton: {
    flex: 1,
    borderRadius: ms(BORDER_RADIUS.xl),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: COLORS.white,
    paddingVertical: ms(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#374151', fontWeight: '700', fontSize: ms(FONT_SIZES.sm) },
  primaryButton: { flex: 1, borderRadius: ms(BORDER_RADIUS.xl), paddingVertical: ms(13), alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: COLORS.white, fontWeight: '800', fontSize: ms(FONT_SIZES.sm) },
});
