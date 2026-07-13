import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

interface RadarPulseProps {
  color?: string;
  size?: number;
}

export default function RadarPulse({ color = '#10b981', size = 10 }: RadarPulseProps) {
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createAnimation(pulseAnim1, 0);
    const anim2 = createAnimation(pulseAnim2, 1000);

    anim1.start();
    anim2.start();

    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [pulseAnim1, pulseAnim2]);

  const scale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.5],
  });

  const opacity1 = pulseAnim1.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.6, 0.6, 0],
  });

  const scale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 3.5],
  });

  const opacity2 = pulseAnim2.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.6, 0.6, 0],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulse,
          {
            backgroundColor: color,
            transform: [{ scale: scale1 }],
            opacity: opacity1,
            width: size * 2,
            height: size * 2,
            borderRadius: size,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulse,
          {
            backgroundColor: color,
            transform: [{ scale: scale2 }],
            opacity: opacity2,
            width: size * 2,
            height: size * 2,
            borderRadius: size,
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    marginRight: 6,
  },
  pulse: {
    position: 'absolute',
  },
  dot: {
    zIndex: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});
