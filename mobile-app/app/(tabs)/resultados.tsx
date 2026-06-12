import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/header';
import useResponsive from '@/hooks/useResponsive';
import { COLORS, FONT_SIZES } from '@/constants/app';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { ProvasAPI } from '@/services/provas';
import { NotasAPI } from '@/services/notas';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DropdownPicker } from '@/components/dropdownPicker';

export default function ResultadosScreen() {
  const router = useRouter();
  const { moderateScale: ms } = useResponsive();
  const [provas, setProvas] = useState<any[]>([]);
  const [selectedProva, setSelectedProva] = useState<number | null>(null);
  const [notas, setNotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const styles = createStyles(ms);

  useEffect(() => {
    (async () => {
      try {
        const p = await ProvasAPI.listar();
        setProvas(p);
        if (p.length > 0) setSelectedProva(p[0].id);
      } catch (err) {
        console.warn('Erro ao carregar provas', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedProva) loadNotas(selectedProva);
  }, [selectedProva]);

  const loadNotas = async (provaId: number) => {
    setLoading(true);
    try {
      const r = await NotasAPI.listar(provaId);
      setNotas(r);
    } catch (err) {
      console.warn('Erro ao carregar notas', err);
      Alert.alert('Erro', 'Não foi possível carregar as notas desta prova.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setModalVisible(true);
  };

  const handleDelete = (item: any) => {
    Alert.alert('Excluir nota', 'Deseja excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await NotasAPI.deletar(item.id);
            loadNotas(selectedProva!);
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível excluir a nota.');
          }
        }
      }
    ]);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await NotasAPI.atualizar(editing.id, {
        nome_aluno: editing.nome_aluno,
        acertos: Number(editing.acertos),
        nota: Number(editing.nota),
      });
      setModalVisible(false);
      setEditing(null);
      loadNotas(selectedProva!);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a alteração.');
    }
  };

  // Monta as opções no formato do DropdownPicker, aproveitando sublabel e badge
  const provaOptions = provas.map((p) => ({
    value: p.id,
    label: p.nome_prova,
    sublabel: p.data ? new Date(p.data).toLocaleDateString('pt-BR') : undefined,
    badge: p.total_questoes ? `${p.total_questoes}q` : undefined,
    badgeBg: '#EEEDFE',
    badgeColor: '#534AB7',
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Notas dos Alunos"
        subtitle="Visualize e edite notas"
        brand={<HeaderBackButton onPress={() => router.back()} />}
      />

      <View style={styles.card}>
        <Text style={styles.label}>Prova / Gabarito</Text>
        <View style={styles.pickerWrapper}>
          <DropdownPicker
            options={provaOptions}
            selectedValue={selectedProva}
            onSelect={(value) => setSelectedProva(Number(value))}
            placeholder="Selecione uma prova"
          />
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator color="#7C3AED" />
        ) : (
          <FlatList
            data={notas}
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.nome_aluno}</Text>
                  <Text style={styles.meta}>Acertos: {item.acertos} • Nota: {item.nota}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(item)}>
                    <IconSymbol name="doc.text" size={ms(18)} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, { marginLeft: ms(8) }]} onPress={() => handleDelete(item)}>
                    <IconSymbol name="ellipsis" size={ms(18)} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Editar Nota</Text>
            <TextInput
              style={styles.input}
              value={editing?.nome_aluno}
              onChangeText={(t) => setEditing((s: any) => ({ ...s, nome_aluno: t }))}
              placeholder="Nome do aluno"
            />
            <TextInput
              style={styles.input}
              value={String(editing?.acertos ?? '')}
              onChangeText={(t) => setEditing((s: any) => ({ ...s, acertos: t }))}
              placeholder="Acertos"
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={String(editing?.nota ?? '')}
              onChangeText={(t) => setEditing((s: any) => ({ ...s, nota: t }))}
              placeholder="Nota"
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', gap: ms(8), marginTop: ms(12) }}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => { setModalVisible(false); setEditing(null); }}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: COLORS.primary }]}
                onPress={saveEdit}
              >
                <Text style={styles.primaryButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (ms: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: { margin: ms(16), borderRadius: ms(14), backgroundColor: COLORS.white, padding: ms(12), elevation: 3 },
  label: { fontWeight: '700', color: COLORS.text.primary, marginBottom: ms(8) },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: ms(10), backgroundColor: COLORS.white },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: ms(12), borderBottomWidth: 1, borderColor: '#F1F5F9' },
  name: { fontWeight: '700', color: '#0F172A' },
  meta: { color: COLORS.text.secondary, marginTop: ms(4) },
  actions: { flexDirection: 'row' },
  iconBtn: { width: ms(36), height: ms(36), borderRadius: ms(10), backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6EAF2' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: ms(24) },
  modalCard: { backgroundColor: COLORS.white, borderRadius: ms(12), padding: ms(16) },
  cardTitle: { fontWeight: '800', fontSize: ms(FONT_SIZES.md), marginBottom: ms(12) },
  input: { borderWidth: 1, borderColor: '#E6EAF2', borderRadius: ms(10), padding: ms(10), marginBottom: ms(8) },
  secondaryButton: { flex: 1, borderRadius: ms(10), borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: COLORS.white, paddingVertical: ms(12), alignItems: 'center' },
  secondaryButtonText: { color: '#374151', fontWeight: '700' },
  primaryButton: { flex: 1, borderRadius: ms(10), paddingVertical: ms(12), alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: COLORS.white, fontWeight: '800' },
  listContainer: { paddingHorizontal: ms(16), paddingTop: ms(12), flex: 1 },
});
