import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

export const softShadow = {
  shadowColor: '#6C5CE7',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 14,
  elevation: 3,
};

export function statusBarPad() {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 54;
}

// Colored header with rounded bottom. top=true when the native header is hidden.
export function Hero({ children, top = false, style }) {
  const { colors } = useTheme();
  const pad = top ? statusBarPad() : 0;
  return (
    <View style={[{
      backgroundColor: colors.bt,
      paddingTop: pad + 10,
      paddingHorizontal: 16,
      paddingBottom: 22,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      overflow: 'hidden',
    }, style]}>
      <View style={{ position: 'absolute', top: -40, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.10)' }} />
      <View style={{ position: 'absolute', bottom: -20, left: -30, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.07)' }} />
      {children}
    </View>
  );
}

export function Card({ children, style, onPress }) {
  const { colors } = useTheme();
  const base = [{ backgroundColor: colors.card, borderRadius: 18, padding: 12, borderWidth: 0.5, borderColor: colors.border }, softShadow, style];
  if (onPress) return <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={base}>{children}</TouchableOpacity>;
  return <View style={base}>{children}</View>;
}

export function IconBubble({ name, size = 34, color, bg, style }) {
  const { colors } = useTheme();
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg || colors.secondary, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name={name} size={size * 0.52} color={color || colors.accent} />
    </View>
  );
}

export function GlassButton({ name, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={17} color="#fff" />
    </TouchableOpacity>
  );
}

export function PillButton({ label, icon, onPress, soft = false, style }) {
  const { colors } = useTheme();
  const fg = soft ? colors.accent : colors.buttonText;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
        backgroundColor: soft ? colors.secondary : colors.bt,
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999,
      }, !soft && softShadow, style]}
    >
      {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 14, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: active ? colors.bt : colors.secondary }}
    >
      <Text style={{ color: active ? colors.buttonText : colors.text, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Fab({ onPress, icon = 'add' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[{ position: 'absolute', bottom: 28 + insets.bottom, right: 22, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bt, alignItems: 'center', justifyContent: 'center' }, softShadow, { shadowOpacity: 0.35 }]}
    >
      <Ionicons name={icon} size={27} color={colors.buttonText} />
    </TouchableOpacity>
  );
}

export function SectionTitle({ title, right }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 5 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{title}</Text>
      {right}
    </View>
  );
}

// Circular progress ring. Put text in `children` (it is centered on top).
export function Ring({ size = 80, pct = 0, stroke = 9, color = '#fff', track = 'rgba(255,255,255,0.25)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeLinecap="round" strokeDasharray={`${(c * p) / 100} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

export const inputStyle = (colors) => ({
  backgroundColor: colors.secondary,
  color: colors.text,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 9,
  fontSize: 14,
  fontWeight: '600',
});

export const PASTELS = ['#A29BFE', '#74B9FF', '#55EFC4', '#FFB8D1', '#FFD166', '#FF9F7A'];
