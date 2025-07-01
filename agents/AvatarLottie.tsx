import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

interface AvatarLottieProps {
  mood: 'idle' | 'happy' | 'sad' | 'excited' | 'concerned' | 'thinking' | 'speaking' | 'listening';
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  onAnimationFinish?: () => void;
}

interface AnimationConfig {
  source: any;
  loop: boolean;
  speed: number;
  autoPlay: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const AvatarLottie: React.FC<AvatarLottieProps> = ({
  mood = 'idle',
  size = 200,
  autoPlay = true,
  loop = true,
  speed = 1,
  onAnimationFinish
}) => {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationConfig | null>(null);
  const lottieRef = useRef<LottieView>(null);

  // Animation configurations for different moods
  const animations = {
    idle: {
      source: require('../assets/animations/avatar-idle.json'),
      loop: true,
      speed: 0.8,
      autoPlay: true
    },
    happy: {
      source: require('../assets/animations/avatar-happy.json'),
      loop: false,
      speed: 1.2,
      autoPlay: true
    },
    sad: {
      source: require('../assets/animations/avatar-sad.json'),
      loop: false,
      speed: 0.6,
      autoPlay: true
    },
    excited: {
      source: require('../assets/animations/avatar-excited.json'),
      loop: false,
      speed: 1.5,
      autoPlay: true
    },
    concerned: {
      source: require('../assets/animations/avatar-concerned.json'),
      loop: false,
      speed: 0.7,
      autoPlay: true
    },
    thinking: {
      source: require('../assets/animations/avatar-thinking.json'),
      loop: true,
      speed: 0.9,
      autoPlay: true
    },
    speaking: {
      source: require('../assets/animations/avatar-speaking.json'),
      loop: true,
      speed: 1.1,
      autoPlay: true
    },
    listening: {
      source: require('../assets/animations/avatar-listening.json'),
      loop: true,
      speed: 0.8,
      autoPlay: true
    }
  };

  useEffect(() => {
    const animation = animations[mood];
    if (animation) {
      setCurrentAnimation({
        ...animation,
        loop: loop !== undefined ? loop : animation.loop,
        speed: speed !== undefined ? speed : animation.speed,
        autoPlay: autoPlay !== undefined ? autoPlay : animation.autoPlay
      });
    }
  }, [mood, loop, speed, autoPlay]);

  useEffect(() => {
    if (lottieRef.current && currentAnimation?.autoPlay) {
      lottieRef.current.play();
    }
  }, [currentAnimation]);

  const handleAnimationFinish = () => {
    // If animation doesn't loop, return to idle after completion
    if (!currentAnimation?.loop && mood !== 'idle') {
      setTimeout(() => {
        setCurrentAnimation(animations.idle);
      }, 1000);
    }
    onAnimationFinish?.();
  };

  if (!currentAnimation) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {/* Fallback static avatar */}
        <View style={styles.fallbackAvatar}>
          <View style={styles.fallbackFace}>
            <View style={styles.fallbackEyes}>
              <View style={styles.fallbackEye} />
              <View style={styles.fallbackEye} />
            </View>
            <View style={styles.fallbackMouth} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        ref={lottieRef}
        source={currentAnimation.source}
        style={styles.animation}
        autoPlay={currentAnimation.autoPlay}
        loop={currentAnimation.loop}
        speed={currentAnimation.speed}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  fallbackAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackFace: {
    width: '60%',
    height: '60%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fallbackEyes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  fallbackEye: {
    width: 12,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  fallbackMouth: {
    width: 20,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
  },
}); 