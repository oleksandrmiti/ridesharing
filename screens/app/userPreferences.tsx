import type { StaticScreenProps } from '@react-navigation/native';

import { View, Text} from 'react-native';

type Props = StaticScreenProps<{
  name: string;
}>;

const UserPreferences = ( ) => {
    return (
      <View>
        <Text>User Preferences Screen</Text>
      </View>
    );
};

export default UserPreferences;
