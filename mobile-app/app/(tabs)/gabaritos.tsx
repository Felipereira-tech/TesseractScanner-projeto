import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Header from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GabaritoCard } from '@/components/ui/gabaritoCard';
import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';


export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header
          title="Meus Gabaritos"
          subtitle=''
          brand={<HeaderBackButton onPress={() => navigation.goBack()} />}
          rightAction={
            <TouchableOpacity style={styles.rightAction}>
            <IconSymbol name="doc.text" size={20} color="#fff" />
            <Text style={styles.rightActionText}>Novo</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <GabaritoCard
          titulo="Gabarito 1"
          descricao="Descricao do gabarito 1"
          questoes={30}
          data="01/01/2024"
          disciplina="geografia"
        />

        <GabaritoCard
          titulo="Gabarito 1"
          descricao="Descricao do gabarito 1"
          questoes={30}
          data="01/01/2024"
          disciplina="matematica"
        />

        <GabaritoCard
          titulo="Gabarito 1"
          descricao="Descricao do gabarito 1"
          questoes={30}
          data="01/01/2024"
          disciplina="portugues"
        />

        <GabaritoCard
          titulo="Gabarito 1"
          descricao="Descricao do gabarito 1"
          questoes={30}
          data="01/01/2024"
          disciplina="geografia"
        />

        <GabaritoCard
                  titulo="Gabarito 1"
                  descricao="Descricao do gabarito 1"
                  questoes={30}
                  data="01/01/2024"
                  disciplina="portugues"
                />

                <GabaritoCard
                  titulo="Gabarito 1"
                  descricao="Descricao do gabarito 1"
                  questoes={30}
                  data="01/01/2024"
                  disciplina="geografia"
                />
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
