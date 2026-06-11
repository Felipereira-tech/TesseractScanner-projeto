import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useResponsive from '@/hooks/useResponsive';
import { COLORS, FONT_SIZES } from '@/constants/app';

type DropdownOption = {
  value: string | number;
  label: string;
};

type DropdownPickerProps = {
  options: DropdownOption[];
  selectedValue?: string | number | null;
  onSelect: (value: string | number) => void;
  placeholder?: string;
};

export function DropdownPicker({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Selecione uma opção',
}: DropdownPickerProps) {
  const { moderateScale: ms } = useResponsive();
  const [open, setOpen] = useState(false);
  const styles = createStyles(ms);

  const selectedOption = options.find((option) => option.value === selectedValue);
  const title = selectedOption?.label ?? placeholder;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.button}
        onPress={() => setOpen((prev) => !prev)}
      >
        <Text style={[styles.text, !selectedOption && styles.placeholder]}>{title}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {open && (
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.list}>
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <TouchableOpacity
                  key={`${option.value}`}
                  style={[styles.item, selected && styles.itemSelected]}
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (ms: (value: number) => number) =>
  StyleSheet.create({
    wrapper: {
      position: 'relative',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: ms(10),
      backgroundColor: COLORS.white,
      zIndex: 10,
    },
    button: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: ms(12),
    },
    text: {
      color: COLORS.text.primary,
      fontSize: ms(FONT_SIZES.sm),
      flex: 1,
    },
    placeholder: {
      color: COLORS.text.secondary,
    },
    arrow: {
      color: COLORS.primary,
      fontSize: ms(12),
      marginLeft: ms(8),
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 998,
    },
    list: {
      position: 'absolute',
      top: ms(48),
      left: 0,
      right: 0,
      zIndex: 999,
      borderTopWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: COLORS.white,
      maxHeight: ms(200),
    },
    item: {
      padding: ms(12),
      borderBottomWidth: 1,
      borderColor: '#F1F5F9',
    },
    itemSelected: {
      backgroundColor: '#F3EEFF',
    },
    itemText: {
      color: COLORS.text.primary,
      fontSize: ms(FONT_SIZES.sm),
    },
    itemTextSelected: {
      color: COLORS.primary,
      fontWeight: '700',
    },
  });
