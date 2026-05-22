import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { darkDesign } from '../theme/darkDesign';

const STAR_IMAGE = require('../../../assets/plotea-star.png');
const STAR_ASSET_RATIO = 1408 / 792;

type PlotStarLoaderProps = {
  size?: 'small' | 'large' | number;
  label?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

function resolveLoaderSize(size: PlotStarLoaderProps['size']) {
  if (typeof size === 'number') {
    return size;
  }

  if (size === 'small') {
    return 28;
  }

  return 76;
}

export function PlotStarLoader({
  size = 'large',
  label,
  style,
  imageStyle,
}: PlotStarLoaderProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const boxSize = resolveLoaderSize(size);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => {
      loop.stop();
      rotation.stopAnimation();
      rotation.setValue(0);
    };
  }, [rotation]);

  const rotationStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const imageWidth = boxSize * 2.3;
  const imageHeight = imageWidth / STAR_ASSET_RATIO;
  const displayLabel = label ? 'Cargando...' : null;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.stage,
          {
            width: boxSize,
            height: boxSize,
            borderRadius: Math.max(12, boxSize * 0.28),
          },
        ]}
      >
        <View style={[styles.glow, { borderRadius: boxSize / 2 }]} />
        <Animated.View style={[styles.rotatingLayer, rotationStyle]}>
          <Image
            source={STAR_IMAGE}
            resizeMode="cover"
            style={[
              {
                width: imageWidth,
                height: imageHeight,
              },
              imageStyle,
            ]}
          />
        </Animated.View>
      </View>
      {displayLabel ? <Text style={styles.label}>{displayLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: darkDesign.spacing.sm,
  },
  stage: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0d0f',
    borderWidth: 1,
    borderColor: 'rgba(126, 226, 184, 0.16)',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(62, 207, 142, 0.08)',
  },
  rotatingLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: darkDesign.colors.textMuted,
    ...darkDesign.typography.caption,
    textAlign: 'center',
  },
});
