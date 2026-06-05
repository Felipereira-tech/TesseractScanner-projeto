import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Header from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GabaritoCard } from '@/components/ui/gabaritoCard';
import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useGabaritos } from '@/context/GabaritosContext';

export default function GabaritosScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { gabaritos, loading, erro, recarregar } = useGabaritos();// Acessa o contexto dos gabaritos para obter os dados, o status de carregamento, possíveis erros e a função para recarregar os gabaritos

  useEffect(() => {
    recarregar();
  }, []);// Efeito para recarregar os gabaritos quando a tela for focada, garantindo que os dados estejam sempre atualizados

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header
          title="Meus Gabaritos"
          subtitle=""
          brand={<HeaderBackButton onPress={() => navigation.goBack()} />}
          rightAction={
            <TouchableOpacity style={styles.rightAction} onPress={() => router.push('/criar-gabarito')}>
              <IconSymbol name="doc.text" size={20} color="#fff" />
              <Text style={styles.rightActionText}>Novo</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator size="large" color="#7C3AED" />}

        {erro && <Text style={{ color: 'red', textAlign: 'center' }}>{erro}</Text>}

        {!loading && !erro && gabaritos.length === 0 && (
          <Text style={{ color: '#bec3ce', textAlign: 'center' }}>
            Nenhum gabarito cadastrado ainda.
          </Text>
        )}

        {gabaritos.map((item) => (
          <GabaritoCard
            key={item.id}
            titulo={item.nome_prova}
            descricao={item.descricao ?? ''}
            questoes={item.quantidade_questoes}
            data={item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '—'}
            onPress={() => router.push({
              pathname: '/(tabs)/scanner',
              params: {
                prova_id: item.id,
                nome_prova: item.nome_prova,
                quantidade_questoes: item.quantidade_questoes,
              },
            })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );// Estrutura principal da tela de gabaritos, incluindo o cabeçalho, a lista de gabaritos e os estados de carregamento e erro
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  listContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  rightAction: {
    gap: 6,
    flexDirection: 'row',
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
  },
  rightActionText: { color: '#ffffff', fontWeight: '600' },
});