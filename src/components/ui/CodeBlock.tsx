import { ScrollView, StyleSheet, View } from 'react-native';

import { makeStyles, radius, spacing, typography } from '@/theme';

import { AppText } from './AppText';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  code: string;
  /** Prefix each line with `$` for shell commands. */
  shell?: boolean;
  copyable?: boolean;
}

export function CodeBlock({ code, shell = false, copyable = true }: CodeBlockProps) {
  const styles = useStyles();
  const display = shell
    ? code
        .split('\n')
        .map((l) => `$ ${l}`)
        .join('\n')
    : code;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <AppText selectable style={styles.code} accessibilityLabel={`Code: ${code}`}>
          {display}
        </AppText>
      </ScrollView>
      {copyable && (
        <View style={styles.copy}>
          <CopyButton text={code} accessibilityLabel={shell ? 'Copy command' : 'Copy code'} />
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.codeBackground,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
    },
    scroll: {
      padding: spacing.md,
      paddingRight: 84,
    },
    code: {
      ...typography.code,
      color: c.codeText,
    },
    copy: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
    },
  }),
);
