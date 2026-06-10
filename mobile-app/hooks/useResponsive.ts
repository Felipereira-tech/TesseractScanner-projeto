import { useMemo } from 'react';
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on iPhone 11 / 12-ish baseline
const guidelineBaseWidth = 390; // slightly larger baseline to be safer on wide phones
const guidelineBaseHeight = 844;

export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const vw = (percent: number) => (SCREEN_WIDTH * percent) / 100;
export const vh = (percent: number) => (SCREEN_HEIGHT * percent) / 100;

export default function useResponsive() {
  return useMemo(() => ({
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    scale,
    verticalScale,
    moderateScale,
    vw,
    vh,
  }), []);
}
