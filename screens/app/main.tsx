import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const Main = () => {

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <View>
      <Text>Main Screen</Text>

    </View>
    </SafeAreaView>
  );
};

export default Main;