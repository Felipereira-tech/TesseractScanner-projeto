import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/header';
import { HeaderBackButton } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { ProvasAPI } from '@/services/provas';
import { NotasAPI } from '@/services/notas';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ResultadosScreen() {
  const router = useRouter();
  const [provas, setProvas] = useState<any[]>([]);
  const [selectedProva, setSelectedProva] = useState<number | null>(null);
  const [notas, setNotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

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
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await NotasAPI.deletar(item.id);
          loadNotas(selectedProva!);
        } catch (err) {
          Alert.alert('Erro', 'Não foi possível excluir a nota.');
        }
      }}
    ]);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await NotasAPI.atualizar(editing.id, { nome_aluno: editing.nome_aluno, acertos: Number(editing.acertos), nota: Number(editing.nota) });
      setModalVisible(false);
      setEditing(null);
      loadNotas(selectedProva!);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a alteração.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Notas dos Alunos" subtitle="Visualize e edite notas" brand={<HeaderBackButton onPress={() => router.back()} />} />

      <View style={styles.card}>
        <Text style={styles.label}>Prova / Gabarito</Text>
        <View style={styles.pickerWrapper}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setPickerOpen(!pickerOpen)}
          >
            <Text style={styles.pickerText}>
              {provas.find(p => p.id === selectedProva)?.nome_prova || 'Selecione uma prova'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          {pickerOpen && (
            <View style={styles.dropdownList}>
              {provas.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.dropdownItem,
                    selectedProva === p.id && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setSelectedProva(p.id);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedProva === p.id && styles.dropdownItemTextSelected
                  ]}>
                    {p.nome_prova}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, flex: 1 }}>
        {loading ? <ActivityIndicator color="#7C3AED" /> : (
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
                    <IconSymbol name="doc.text" size={18} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => handleDelete(item)}>
                    <IconSymbol name="ellipsis" size={18} color="#DC2626" />
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
            <TextInput style={styles.input} value={editing?.nome_aluno} onChangeText={(t) => setEditing((s:any)=>({...s, nome_aluno: t}))} placeholder="Nome do aluno" />
            <TextInput style={styles.input} value={String(editing?.acertos ?? '')} onChangeText={(t) => setEditing((s:any)=>({...s, acertos: t}))} placeholder="Acertos" keyboardType="numeric" />
            <TextInput style={styles.input} value={String(editing?.nota ?? '')} onChangeText={(t) => setEditing((s:any)=>({...s, nota: t}))} placeholder="Nota" keyboardType="numeric" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => { setModalVisible(false); setEditing(null); }}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#7C3AED' }]} onPress={saveEdit}>
                <Text style={styles.primaryButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  card: { margin: 16, borderRadius: 14, backgroundColor: '#fff', padding: 12, elevation: 3 },
  label: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, backgroundColor: '#fff' },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  pickerText: { color: '#111827', fontSize: 15, flex: 1 },
  pickerArrow: { color: '#7C3AED', fontSize: 12, marginLeft: 8 },
  dropdownList: { borderTopWidth: 1, borderColor: '#E5E7EB', maxHeight: 200 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  dropdownItemSelected: { backgroundColor: '#F3EEFF' },
  dropdownItemText: { color: '#111827', fontSize: 15 },
  dropdownItemTextSelected: { color: '#7C3AED', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  name: { fontWeight: '700', color: '#0F172A' },
  meta: { color: '#6B7280', marginTop: 4 },
  actions: { flexDirection: 'row' },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6EAF2' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E6EAF2', borderRadius: 10, padding: 10, marginBottom: 8 },
  secondaryButton: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#374151', fontWeight: '700' },
  primaryButton: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
});