import React from 'react';
import { useTheme } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Feather from '@expo/vector-icons/Feather';

type HorizontalBoxProps = {
    title: string;
    buttonText?: string;
    iconName?: string;
    iconColor?: string;
    onPress?: () => void; // Optional, for buttons
    dropdownOptions?: string[]; // Optional, for dropdowns
    dropdownValue?: string; // Optional, current dropdown value
    onDropdownChange?: (value: string) => void; // Optional, for dropdown changes
  };

  const HorizontalBox: React.FC<HorizontalBoxProps> = ({
    title,
    buttonText,
    iconName,
    iconColor,
    onPress,
    dropdownOptions,
    dropdownValue,
    onDropdownChange,
  }) => {
    const colors = useTheme().colors;

    const dynamicStyles = StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 13,
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 20,
        marginBottom: 16,
        backgroundColor: colors.backgroundLight,
      },
      buttonText: {
        color: colors.buttonText,
        fontFamily: 'Inter-Bold',
        fontSize: 14,
      },
    });

    return (
      <View style={dynamicStyles.container}>
        <Text style={styles.title}>{title}</Text>
        {buttonText ? (
          <TouchableOpacity 
          style={buttonText === 'Logout' ? styles.logoutButton : styles.button} 
          onPress={onPress}
        >
          <Text style={buttonText === 'Logout' ? styles.logoutButtonText : dynamicStyles.buttonText}>{buttonText}</Text>
          {iconName && <Feather name={iconName} size={20} color={iconColor} style={styles.icon} />}
        </TouchableOpacity>
        
        ) : dropdownOptions ? (
          <View style={[styles.dropdownContainer]}>
            <Picker
              selectedValue={dropdownValue}
              onValueChange={(value) => onDropdownChange && onDropdownChange(value as string)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {dropdownOptions.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        ) : null}
      </View>
    );
  };

const styles = StyleSheet.create({
      title: {
        fontSize: 16,
        fontFamily: 'Inter-Bold',
        color: '#333',
        flex: 1,
      },
      button: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#735BF2',
        minWidth: 80,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
      },  
      logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 43, 93, 0.15)',
        minWidth: 80,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
      },
      logoutButtonText: {
        color: '#FF0000',
        fontSize: 14,
        fontFamily: 'Inter-Bold',
      },
      icon: {
        marginLeft: 8,  // Space between the text and the icon
      },
      dropdownContainer: {
        width: 150,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
      },
      picker: {
        width: '100%',
        height: Platform.OS === 'ios' ? 40 : undefined,
        borderRadius: 50,
      }
});

export default HorizontalBox;
