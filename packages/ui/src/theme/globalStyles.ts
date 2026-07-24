import { colors, typography } from './tokens';

export const globalStyles = `
:root {
  --qd-color-primary-500: ${colors.primary[500]};
  --qd-color-primary-600: ${colors.primary[600]};
  --qd-color-neutral-0: ${colors.neutral[0]};
  --qd-color-neutral-100: ${colors.neutral[100]};
  --qd-color-neutral-200: ${colors.neutral[200]};
  --qd-color-neutral-800: ${colors.neutral[800]};
  --qd-color-success: ${colors.success};
  --qd-color-warning: ${colors.warning};
  --qd-color-error: ${colors.error};
  --qd-font-family: ${typography.fontFamily};
  --qd-mono-family: ${typography.monoFamily};
}

.qd-reset, .qd-reset * {
  box-sizing: border-box;
}

.qd-root {
  font-family: var(--qd-font-family);
  color: ${colors.neutral[800]};
}
`;
