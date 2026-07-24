import type { Config } from 'tailwindcss';
import { colors, spacing, radius, shadows, typography } from '../../packages/ui/src/theme/tokens';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'qd-primary': colors.primary,
        'qd-neutral': colors.neutral,
        'qd-success': colors.success,
        'qd-warning': colors.warning,
        'qd-error': colors.error,
        'qd-info': colors.info,
      },
      spacing,
      borderRadius: {
        'qd-sm': radius.sm,
        'qd-md': radius.md,
        'qd-lg': radius.lg,
        'qd-xl': radius.xl,
        'qd-full': radius.full,
      },
      boxShadow: {
        'qd-sm': shadows.sm,
        'qd-md': shadows.md,
        'qd-lg': shadows.lg,
        'qd-card': shadows.card,
      },
      fontFamily: {
        qd: typography.fontFamily.split(', '),
        'qd-mono': typography.monoFamily.split(', '),
      },
    },
  },
  plugins: [],
};

export default config;
