import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
};

export default function Fab({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.fab}>
      <Text style={styles.plus}>＋</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6D5EF5',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  plus: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
});