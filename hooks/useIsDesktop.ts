import { Platform, useWindowDimensions } from 'react-native';

export const DESKTOP_BREAKPOINT = 1024;

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;
}
