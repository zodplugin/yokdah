// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'map': 'map',
  'map.fill': 'map',
  'person.2': 'group',
  'person.2.fill': 'group',
  'person.crop.circle': 'account-circle',
  'person.crop.circle.fill': 'account-circle',
  'clock.fill': 'schedule',
  'exclamationmark.triangle.fill': 'error',
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'camera.fill': 'photo-camera',
  'checkmark': 'check',
  'rectangle.portrait.and.arrow.right': 'logout',
  'gearshape.fill': 'settings',
  'bell.fill': 'notifications',
  'calendar': 'event',
  'mappin.and.ellipse': 'place',
  'mappin': 'place',
  'info.circle': 'info',
  'arrow.up': 'arrow-upward',
  'music.note': 'music-note',
  'sparkles': 'celebration',
  'wineglass.fill': 'nightlife',
  'figure.walk': 'directions-walk',
  'sportscourt.fill': 'sports-soccer',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
