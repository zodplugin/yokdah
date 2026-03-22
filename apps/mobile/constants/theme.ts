/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#0F1209',        // var(--text)
    background: '#FFFFFF',  // var(--bg)
    tint: '#B8F040',        // var(--accent)
    icon: '#9AA08C',        // var(--muted)
    tabIconDefault: '#9AA08C',
    tabIconSelected: '#B8F040',
    surface: '#FFFFFF',     // var(--surface)
    border: '#E8EAE3',      // var(--border)
    border2: '#D4D8CC',     // var(--border2)
    muted: '#9AA08C',       // var(--muted)
    muted2: '#5C6050',      // var(--muted2)
    accent: '#B8F040',      // var(--accent)
    accent_dim: 'rgba(184, 240, 64, 0.15)',
    accent_text: '#3D5A00', // var(--accent-text)
    bg2: '#F7F8F5',         // var(--bg2)
    bg3: '#F0F2EC',         // var(--bg3)
  },
  dark: {
    // Keep it simple for now, mostly matching web's light-centric design
    text: '#0F1209',
    background: '#FFFFFF',
    tint: '#B8F040',
    icon: '#9AA08C',
    tabIconDefault: '#9AA08C',
    tabIconSelected: '#B8F040',
    surface: '#FFFFFF',
    border: '#E8EAE3',
    border2: '#D4D8CC',
    muted: '#9AA08C',
    muted2: '#5C6050',
    accent: '#B8F040',
    accent_dim: 'rgba(184, 240, 64, 0.15)',
    accent_text: '#3D5A00',
    bg2: '#F7F8F5',
    bg3: '#F0F2EC',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
