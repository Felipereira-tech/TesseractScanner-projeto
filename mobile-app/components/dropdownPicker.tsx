import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  StyleSheet, Pressable,
} from 'react-native';

export interface DropdownOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}

interface DropdownPickerProps {
  options: DropdownOption[];
  selectedValue: string | number | null;
  onSelect: (value: string | number) => void;
  placeholder?: string;
}

export function DropdownPicker({ options, selectedValue, onSelect, placeholder }: DropdownPickerProps) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ x: 0, y: 0, width: 0 });
  const btnRef = useRef<React.ElementRef<typeof TouchableOpacity> | null>(null);

  const selected = options.find((o) => o.value === selectedValue);

  const openDropdown = () => {
    btnRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setDropPos({ x, y: y + height, width });
      setOpen(true);
    });
  };

  return (
    <>
      <TouchableOpacity ref={btnRef} style={styles.button} onPress={openDropdown} activeOpacity={0.8}>
        {selected?.icon && (
          <View style={styles.btnIconWrap}>{selected.icon}</View>
        )}
        <View style={styles.btnTexts}>
          {selected ? (
            <>
              <Text style={styles.btnLabel}>{selected.label}</Text>
              {selected.sublabel && (
                <Text style={styles.btnSublabel}>{selected.sublabel}</Text>
              )}
            </>
          ) : (
            <Text style={styles.placeholder}>{placeholder ?? 'Selecione'}</Text>
          )}
        </View>
        <Text style={styles.arrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />

        <View style={[styles.dropdown, {
          top: dropPos.y,
          left: dropPos.x,
          width: dropPos.width,
        }]}>
          <FlatList
            data={options}
            keyExtractor={(i) => String(i.value)}
            style={{ maxHeight: 280 }}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  {item.icon && (
                    <View style={styles.itemIconWrap}>{item.icon}</View>
                  )}
                  <View style={styles.itemTexts}>
                    <Text style={[styles.itemLabel, isSelected && styles.itemLabelSelected]}>
                      {item.label}
                    </Text>
                    {item.sublabel && (
                      <Text style={styles.itemSublabel}>{item.sublabel}</Text>
                    )}
                  </View>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: item.badgeBg ?? '#EEEDFE' }]}>
                      <Text style={[styles.badgeText, { color: item.badgeColor ?? '#534AB7' }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  {isSelected && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  btnIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEEDFE',
  },
  btnTexts: { flex: 1 },
  btnLabel: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  btnSublabel: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  placeholder: { fontSize: 15, color: '#9CA3AF' },
  arrow: { fontSize: 11, color: '#7C3AED', marginLeft: 4 },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemSelected: { backgroundColor: '#EEEDFE' },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  itemTexts: { flex: 1 },
  itemLabel: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  itemLabelSelected: { color: '#534AB7' },
  itemSublabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  check: { fontSize: 15, color: '#7C3AED', marginLeft: 4 },
});
