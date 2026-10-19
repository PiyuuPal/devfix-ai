import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Option } from '@/constants/options';
import { makeStyles, maxContentWidth, minTouchTarget, radius, spacing, useColors } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

interface SelectSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

/** Bottom-sheet list of options. Used by `Select` and settings rows. */
export function SelectSheet<T extends string>({ visible, title, options, value, onSelect, onClose }: SelectSheetProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} accessibilityViewIsModal>
        <View style={styles.handle} />
        <AppText variant="heading" accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => {
                  onSelect(o.value);
                  onClose();
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={o.description ? `${o.label}. ${o.description}` : o.label}
                style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
                <View style={styles.optionText}>
                  <AppText variant="subheading" tone={selected ? 'accent' : 'primary'}>
                    {o.label}
                  </AppText>
                  {o.description && (
                    <AppText variant="small" tone="secondary">
                      {o.description}
                    </AppText>
                  )}
                </View>
                {selected && <Icon name="check" size={18} color={colors.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface SelectProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Dropdown-style field that opens a `SelectSheet`. */
export function Select<T extends string>({ label, options, value, onChange }: SelectProps<T>) {
  const colors = useColors();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={styles.field}>
      <AppText variant="subheading">{label}</AppText>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? value}`}
        accessibilityHint="Opens a list of options"
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        <AppText variant="body">{current?.label ?? value}</AppText>
        <Icon name="chevronDown" size={16} color={colors.textSecondary} />
      </Pressable>
      <SelectSheet
        visible={open}
        title={label}
        options={options}
        value={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    field: { gap: spacing.sm },
    trigger: {
      minHeight: minTouchTarget + 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: { opacity: 0.75 },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: c.overlay,
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '75%',
      width: '100%',
      maxWidth: maxContentWidth,
      alignSelf: 'center',
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderStrong,
      paddingTop: spacing.sm,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderStrong,
      marginBottom: spacing.md,
    },
    title: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
    list: { flexGrow: 0 },
    listContent: { paddingHorizontal: spacing.lg, gap: spacing.xs },
    option: {
      minHeight: minTouchTarget + 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    optionSelected: { backgroundColor: `${c.primary}1A` },
    optionText: { flex: 1, gap: 2 },
  }),
);
