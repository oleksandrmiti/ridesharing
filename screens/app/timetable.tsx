import type { StaticScreenProps } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StaticScreenProps<{
  name: string;
}>;

const Timetable = ( ) => {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
        <View>
          <Text>Timetable Screen</Text>
        </View>
      </SafeAreaView>
    );
};

export default Timetable;