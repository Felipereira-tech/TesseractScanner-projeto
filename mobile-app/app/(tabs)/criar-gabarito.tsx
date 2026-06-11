import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter, useLocalSearchParams } from 'expo-router';

import Header from '@/components/header';
import useResponsive from '@/hooks/useResponsive';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, VALIDATION } from '@/constants/app';
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const salvarClickedRef = useRef(false);
  const isEditing = Boolean(params?.id);

  const accentColor = '#7C3AED';

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    const provaId = Number(params.id);
    setProvaId(provaId);

    const nome = params.nome_prova ? decodeURIComponent(String(params.nome_prova)) : '';
    const descricao = params.descricao ? decodeURIComponent(String(params.descricao)) : '';
    const qtd = Number(params.quantidade_questoes ?? DEFAULT_QUESTOES);

    setNomeProva(nome);
    setDescricaoProva(descricao);
    setNumeroQuestoes(qtd);

    console.log(`[Edição] Carregando gabarito ID=${provaId}, qtd=${qtd}`);

    const loadGabarito = async () => {
      setCarregandoGabarito(true);
      try {
        if (params.respostas && String(params.respostas).length > 0) {
          try {
            const raw = typeof params.respostas === 'string' ? decodeURIComponent(params.respostas) : String(params.respostas);
            const respostaLista = raw
              .split(',')
              .map((item) => item.trim().toUpperCase())
              .filter((item) => ALTERNATIVAS.includes(item as Alternativa)) as Alternativa[];

            if (respostaLista.length > 0) {
              console.log(`[Edição] Carregadas ${respostaLista.length} respostas dos parâmetros`);
              if (respostaLista.length < qtd) {
                setRespostas([...respostaLista, ...createEmptyAnswers(qtd - respostaLista.length)]);
              } else {
                setRespostas(respostaLista.slice(0, qtd));
              }
              return;
            }
          } catch (err) {
            console.warn('[Edição] Erro ao parsear respostas dos params, tentando backend:', err);
          }
        }

        const g = await ProvasAPI.buscarGabarito(provaId);
        if (g) {
          console.log('[Edição] Gabarito encontrado no backend:', g);
          if (g.respostas) {
            const mapped = (g.respostas as Array<any>).map((r) => {
              if (typeof r === 'number') return ALTERNATIVAS[r] ?? null;
              if (typeof r === 'string') {
                const up = r.trim().toUpperCase();
                if (ALTERNATIVAS.includes(up as Alternativa)) return up as Alternativa;
                if (!isNaN(Number(r))) return ALTERNATIVAS[Number(r)] ?? null;
              }
              return null;
            });

            console.log(`[Edição] Mapeadas ${mapped.length} respostas do backend`);

            if (mapped.length === qtd) {
              setRespostas(mapped as Array<Alternativa | null>);
            } else if (mapped.length > qtd) {
              setRespostas((mapped as Array<Alternativa | null>).slice(0, qtd));
            } else {
              setRespostas([...(mapped as Array<Alternativa | null>), ...createEmptyAnswers(qtd - mapped.length)]);
            }
          } else {
            console.warn('[Edição] Gabarito não tem respostas, inicializando vazias');
            setRespostas(createEmptyAnswers(qtd));
          }
        } else {
          console.warn('[Edição] Gabarito não encontrado no backend');
        }
      } catch (err) {
        console.warn('[Edição] Erro ao buscar gabarito do backend:', err);
      } finally {
        setCarregandoGabarito(false);
      }
    };

    loadGabarito();
  }, [params]);

  useEffect(() => {
    if (!isEditing && numeroQuestoes > 0) {
      setRespostas((prev) => {
        if (prev.length === numeroQuestoes) return prev;
        if (prev.length > numeroQuestoes) return prev.slice(0, numeroQuestoes);
        return [...prev, ...createEmptyAnswers(numeroQuestoes - prev.length)];
      });
    } else if (isEditing && numeroQuestoes > 0) {
      // Em modo edição, sincroniza respostas com o novo número de questões
      // mas preserva as respostas já preenchidas
      setRespostas((prev) => {
        if (prev.length === numeroQuestoes) return prev;
        if (prev.length > numeroQuestoes) {
          console.log(`[Edição] Reduzindo respostas de ${prev.length} para ${numeroQuestoes}`);
          return prev.slice(0, numeroQuestoes);
        }
        console.log(`[Edição] Adicionando ${numeroQuestoes - prev.length} respostas vazias`);
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
    if (salvarClickedRef.current) {
      return;
    }
    salvarClickedRef.current = true;

    const nomeTratado = nomeProva.trim();

    if (!nomeTratado) {
      salvarClickedRef.current = false;
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
        console.log(`[Salvar] Atualizando gabarito ID=${provaId}`, {
          titulo: nomeTratado,
          descricao: descricaoProva.trim(),
          questoes: numeroQuestoes,
          respostas: respostas.join(','),
        });

        await updateGabarito(provaId, {
          titulo: nomeTratado,
          descricao: descricaoProva.trim() || `Gabarito com ${numeroQuestoes} questões`,
          questoes: numeroQuestoes,
          respostas: respostas as Alternativa[],
        });

        console.log('[Salvar] Gabarito atualizado com sucesso!');
        
        Alert.alert('Gabarito atualizado', `O gabarito "${nomeTratado}" foi atualizado com sucesso.`, [
          { text: 'OK', onPress: () => router.replace('/gabaritos') },
        ]);
      } else {
        console.log('[Salvar] Criando novo gabarito', {
          titulo: nomeTratado,
          descricao: descricaoProva.trim(),
          questoes: numeroQuestoes,
          respostas: respostas.join(','),
        });

        await addGabarito({
          titulo: nomeTratado,
          descricao: descricaoProva.trim() || `Gabarito com ${numeroQuestoes} questões`,
          questoes: numeroQuestoes,
          respostas: respostas as Alternativa[],
        });

        console.log('[Salvar] Novo gabarito criado com sucesso!');
        resetForm();
        Alert.alert('Gabarito salvo', `O gabarito "${nomeTratado}" foi salvo com sucesso.`, [
          { text: 'OK', onPress: () => router.replace('/gabaritos') },
        ]);
      }
    } catch (err: any) {
      console.error('[Salvar] Erro:', err);
      const mensagemErro = err?.response?.data?.mensagem ?? err?.message ?? 'Não foi possível salvar o gabarito. Verifique sua conexão.';
      Alert.alert('Erro ao salvar', mensagemErro);
    } finally {
      setSalvando(false);
      salvarClickedRef.current = false;
    }
  };

  const styles = createStyles(ms);
  const isFormDisabled = salvando || carregandoGabarito;
  const screenTitle = isEditing ? 'Editar Gabarito' : 'Criar Gabarito';
  const screenSubtitle = isEditing ? 'Atualize os dados e as respostas do gabarito' : 'Preencha os dados e marque as respostas';
  const saveLabel = isEditing ? 'Salvar alterações' : 'Salvar';

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={screenTitle}
        subtitle={screenSubtitle}
        brand={<HeaderBackButton onPress={() => router.push('/gabaritos')} />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { zIndex: 999 }]}>
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

          <View style={[styles.fieldGroup, { zIndex: 999 }]}>
            <Text style={styles.fieldLabel}>Número de questões</Text>
            <View style={[styles.selectWrapper, { zIndex: 999 }]}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setPickerOpen(!pickerOpen)}
              >
                <Text style={styles.pickerText}>{numeroQuestoes} questões</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>

              {pickerOpen && (
                <Pressable style={styles.pickerOverlay} onPress={() => setPickerOpen(false)}>
                  <View style={[styles.dropdownList, { position: 'absolute', top: ms(48), left: 0, right: 0, zIndex: 999 }]}> 
                    {QUESTOES_OPTIONS.map((q) => (
                      <TouchableOpacity
                        key={q}
                        style={[
                          styles.dropdownItem,
                          numeroQuestoes === q && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          setNumeroQuestoes(q);
                          setPickerOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          numeroQuestoes === q && styles.dropdownItemTextSelected,
                        ]}>
                          {q} questões
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Pressable>
              )}
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

const createStyles = (ms: (n:number)=>number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: ms(SPACING.lg), paddingTop: ms(SPACING.lg), paddingBottom: ms(SPACING.xxl), gap: ms(SPACING.md) },
  card: {
    width: '100%', borderRadius: ms(BORDER_RADIUS.xxl), backgroundColor: COLORS.white, padding: ms(SPACING.lg),
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: ms(14),
    shadowOffset: { width: 0, height: ms(6) }, elevation: 4,
  },
  cardTitle: { fontSize: ms(FONT_SIZES.md), fontWeight: '800', color: COLORS.text.primary, marginBottom: ms(SPACING.md) },
  fieldGroup: { marginBottom: ms(SPACING.md) },
  emptyText: { fontSize: ms(FONT_SIZES.md), color: COLORS.text.tertiary, textAlign: 'center', paddingHorizontal: ms(SPACING.lg) },
  fieldLabel: { fontSize: ms(FONT_SIZES.sm), fontWeight: '700', color: COLORS.text.primary, marginBottom: ms(8) },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: ms(BORDER_RADIUS.md),
    backgroundColor: COLORS.white, paddingHorizontal: ms(12),
    paddingVertical: ms(10), fontSize: ms(FONT_SIZES.sm), color: COLORS.text.primary,
  },
  selectWrapper: { position: 'relative', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: ms(BORDER_RADIUS.md), backgroundColor: COLORS.white },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ms(12) },
  pickerText: { color: COLORS.text.primary, fontSize: ms(FONT_SIZES.sm), flex: 1 },
  pickerArrow: { color: COLORS.primary, fontSize: ms(12), marginLeft: ms(8) },
  dropdownList: { borderTopWidth: 1, borderColor: '#E5E7EB', backgroundColor: COLORS.white, maxHeight: ms(200) },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 },
  dropdownItem: { padding: ms(12), borderBottomWidth: 1, borderColor: '#F1F5F9' },
  dropdownItemSelected: { backgroundColor: '#F3EEFF' },
  dropdownItemText: { color: COLORS.text.primary, fontSize: ms(FONT_SIZES.sm) },
  dropdownItemTextSelected: { color: COLORS.primary, fontWeight: '700' },
  fieldHint: { marginTop: ms(6), fontSize: ms(FONT_SIZES.xs), color: COLORS.text.secondary },
  questionsList: { flexDirection: 'column', gap: ms(10) },
  questionCard: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: ms(BORDER_RADIUS.md),
    padding: ms(12), width: '100%', backgroundColor: '#FBFDFF',
  },
  questionTitle: { fontSize: ms(FONT_SIZES.sm), fontWeight: '700', color: COLORS.text.primary, marginBottom: ms(10) },
  alternativasList: { flexDirection: 'row', gap: ms(6), justifyContent: 'space-between' },
  alternativaButton: {
    flex: 1, minHeight: ms(44), borderRadius: ms(BORDER_RADIUS.md), borderWidth: 1,
    borderColor: '#CBD5E1', backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', paddingVertical: ms(10),
  },
  alternativaText: { fontSize: ms(FONT_SIZES.sm), fontWeight: '800', color: '#475569' },
  alternativaTextSelected: { color: COLORS.white },
  actionsRow: { flexDirection: 'row', gap: ms(10), marginTop: ms(4), marginBottom: ms(10) },
  secondaryButton: {
    flex: 1, borderRadius: ms(BORDER_RADIUS.xl), borderWidth: 1, borderColor: '#D1D5DB',
    backgroundColor: COLORS.white, paddingVertical: ms(13),
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryButtonText: { color: '#374151', fontWeight: '700', fontSize: ms(FONT_SIZES.sm) },
  primaryButton: { flex: 1, borderRadius: ms(BORDER_RADIUS.xl), paddingVertical: ms(13), alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: COLORS.white, fontWeight: '800', fontSize: ms(FONT_SIZES.sm) },
});