import type { StaticScreenProps } from '@react-navigation/native';
import { View, Text} from 'react-native';

type Props = StaticScreenProps<{
  name: string;
}>;

const Timetable = ( ) => {
    return (
      <View>
        <Text>Timetable Screen</Text>
      </View>
    );
};

export default Timetable;
