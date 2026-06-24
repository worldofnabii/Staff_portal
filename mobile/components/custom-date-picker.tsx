import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CustomDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function CustomDatePicker({
  value,
  onChange,
  minimumDate,
  maximumDate,
}: CustomDatePickerProps) {
  const [show, setShow] = React.useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.dateSelector} onPress={() => setShow(true)}>
        <Ionicons name="calendar-outline" size={20} color="#db2777" style={styles.inputIcon} />
        <Text style={styles.dateText}>{value.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginLeft: 4,
  },
});
