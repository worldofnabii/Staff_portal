import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [isFocused, setIsFocused] = useState(false);

  // Format Date to YYYY-MM-DD for HTML5 date input
  const formatDateString = (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
  };

  const handleWebChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      onChange(new Date(val));
    }
  };

  return (
    <View style={[styles.webContainer, isFocused && styles.webContainerFocused]}>
      <Ionicons name="calendar-outline" size={20} color="#db2777" style={styles.inputIcon} />
      <input
        type="date"
        value={formatDateString(value)}
        min={minimumDate ? formatDateString(minimumDate) : undefined}
        max={maximumDate ? formatDateString(maximumDate) : undefined}
        onChange={handleWebChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          flex: 1,
          border: 'none',
          backgroundColor: 'transparent',
          outline: 'none',
          fontSize: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          color: '#1f2937',
          fontWeight: '500',
          cursor: 'pointer',
          width: '100%',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  } as any,
  webContainerFocused: {
    borderColor: '#db2777',
    boxShadow: '0 0 0 1px #db2777',
  } as any,
  inputIcon: {
    marginRight: 12,
  },
});
