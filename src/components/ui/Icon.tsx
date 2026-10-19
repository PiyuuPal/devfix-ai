import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

type SymbolName = SymbolViewProps['name'];

/** Semantic icon names → SF Symbols (iOS) + Material Symbols (Android / web). */
const ICONS = {
  code: { ios: 'chevron.left.forwardslash.chevron.right', android: 'code', web: 'code' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  moon: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
  globe: { ios: 'globe', android: 'translate', web: 'translate' },
  shield: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  bug: { ios: 'ladybug.fill', android: 'bug_report', web: 'bug_report' },
  terminal: { ios: 'terminal', android: 'terminal', web: 'terminal' },
  lightbulb: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
  wrench: { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' },
  doc: { ios: 'doc.text', android: 'description', web: 'description' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  cpu: { ios: 'cpu', android: 'memory', web: 'memory' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  react: { ios: 'atom', android: 'atr', web: 'atr' },
  expo: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  android: { ios: 'iphone.gen1', android: 'android', web: 'android' },
  ios: { ios: 'apple.logo', android: 'phone_iphone', web: 'phone_iphone' },
  server: { ios: 'server.rack', android: 'dns', web: 'dns' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color: ColorValue;
}

/** Decorative by default — the parent control carries the accessibility label. */
export function Icon({ name, size = 20, color }: IconProps) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
