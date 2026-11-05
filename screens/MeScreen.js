import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUser } from '../dbHelpers';
import { useTheme } from '../ThemeContext';
import { Card, IconBubble, statusBarPad } from '../ui';

export default function MeScreen({ navigation }) {
  const { theme, colors, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  useFocusEffect(useCallback(() => { setUser(getUser()); }, []));

  const Row = ({ icon, title, sub, onPress, last }) => (
    <TouchableOpacity style={[styles.row, !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]} onPress={onPress}>
      <IconBubble name={icon} size={36} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.subText} />
    </TouchableOpacity>
  );

  const details = [user?.university, user?.student_id ? `ID ${user.student_id}` : null, user?.year ? `Year ${user.year}` : null].filter(Boolean).join(' · ');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: statusBarPad() + 8, paddingBottom: 24 }}>
      <Text style={[styles.title, { color: colors.text }]}>Me</Text>

      <Card style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: colors.bt }]}>
          <Text style={styles.avatarText}>{(user?.name || 'S').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{user?.name || 'Student'}</Text>
          {!!details && <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600', marginTop: 2 }} numberOfLines={2}>{details}</Text>}
        </View>
      </Card>

      <Card style={styles.list}>
        <Row icon="person-outline" title="Student file" sub="Previous CGPA and credit hours" onPress={() => navigation.navigate('UserSetup')} />
        <Row icon="happy-outline" title="Daily log" sub="Prayers, habits and streaks" onPress={() => navigation.navigate('Personal')} />
        <Row icon="journal-outline" title="Journal" sub="Your private notes" onPress={() => navigation.navigate('Journal')} />
        <View style={styles.row}>
          <IconBubble name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Dark mode</Text>
            <Text style={{ color: colors.subText, fontSize: 12, fontWeight: '600' }}>Easier on the eyes at night</Text>
          </View>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ true: colors.bt, false: colors.border }} thumbColor="#fff" />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', marginHorizontal: 14, marginBottom: 12 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 14, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800' },
  list: { marginHorizontal: 14, paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
});
