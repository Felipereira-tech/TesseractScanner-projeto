import { Alert, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GabaritoCard } from '@/components/ui/gabaritoCard';
import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useGabaritos } from '@/context/GabaritosContext';


export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { gabaritos, removeGabarito } = useGabaritos();

  const handleGabaritoOptions = (id: string, titulo: string) => {
    Alert.alert(titulo, undefined, [
      {
        text: 'Editar',
        onPress: () => router.push(`/criar-gabarito?editId=${encodeURIComponent(id)}`),
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => removeGabarito(id),
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header
          title="Meus Gabaritos"
          subtitle=""
          brand={<HeaderBackButton onPress={() => router.push('/home')} />}
          rightAction={
            <TouchableOpacity style={styles.rightAction} onPress={() => router.push('/criar-gabarito')}>
              <IconSymbol name="description" size={20} color="#fff" />
              <Text style={styles.rightActionText}>Novo</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {gabaritos.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum gabarito salvo ainda. Clique em Novo para criar um.</Text>
        ) : (
          gabaritos.map((gabarito) => (
            <GabaritoCard
              key={gabarito.id}
              titulo={gabarito.titulo}
              descricao={gabarito.descricao}
              questoes={gabarito.questoes}
              data={gabarito.data}
              onOptionsPress={() => handleGabaritoOptions(gabarito.id, gabarito.titulo)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContent: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
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
  rightActionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
