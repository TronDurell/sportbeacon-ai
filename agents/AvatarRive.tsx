import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Rive, Fit, Alignment } from 'rive-react-native';

interface AvatarRiveProps {
  state: 'idle' | 'listening' | 'responding' | 'thinking' | 'happy' | 'concerned' | 'speaking';
  size?: number;
  autoPlay?: boolean;
  onStateChange?: (state: string) => void;
  onAnimationFinish?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const AvatarRive: React.FC<AvatarRiveProps> = ({
  state = 'idle',
  size = 200,
  autoPlay = true,
  onStateChange,
  onAnimationFinish
}) => {
  const [riveState, setRiveState] = useState(state);
  const [isLoaded, setIsLoaded] = useState(false);
  const riveRef = useRef<Rive>(null);

  // State machine for avatar animations
  const stateMachine = {
    idle: {
      animation: 'idle',
      inputs: {},
      nextStates: ['listening', 'thinking', 'speaking']
    },
    listening: {
      animation: 'listening',
      inputs: { 'isListening': true },
      nextStates: ['responding', 'thinking', 'idle']
    },
    responding: {
      animation: 'speaking',
      inputs: { 'isSpeaking': true },
      nextStates: ['idle', 'thinking']
    },
    thinking: {
      animation: 'thinking',
      inputs: { 'isThinking': true },
      nextStates: ['responding', 'idle']
    },
    happy: {
      animation: 'happy',
      inputs: { 'mood': 'happy' },
      nextStates: ['idle', 'speaking']
    },
    concerned: {
      animation: 'concerned',
      inputs: { 'mood': 'concerned' },
      nextStates: ['idle', 'thinking']
    },
    speaking: {
      animation: 'speaking',
      inputs: { 'isSpeaking': true },
      nextStates: ['idle', 'listening']
    }
  };

  useEffect(() => {
    if (riveRef.current && isLoaded && state !== riveState) {
      changeState(state);
    }
  }, [state, isLoaded]);

  const changeState = (newState: string) => {
    if (!riveRef.current || !stateMachine[newState]) return;

    const stateConfig = stateMachine[newState];
    
    try {
      // Set animation
      riveRef.current.play(stateConfig.animation);
      
      // Set inputs
      Object.entries(stateConfig.inputs).forEach(([inputName, value]) => {
        const input = riveRef.current?.stateMachineInputs('State Machine 1')?.find(
          input => input.name === inputName
        );
        if (input) {
          input.value = value;
        }
      });

      setRiveState(newState);
      onStateChange?.(newState);

    } catch (error) {
      console.error('Error changing Rive state:', error);
    }
  };

  const handleRiveLoad = () => {
    setIsLoaded(true);
    if (autoPlay) {
      changeState(state);
    }
  };

  const handleAnimationFinish = () => {
    onAnimationFinish?.();
    
    // Auto-transition to idle after certain animations
    if (riveState !== 'idle' && !stateMachine[riveState].nextStates.includes('idle')) {
      setTimeout(() => {
        changeState('idle');
      }, 2000);
    }
  };

  const triggerBlink = () => {
    if (riveRef.current && isLoaded) {
      try {
        riveRef.current.play('blink');
      } catch (error) {
        console.error('Error triggering blink:', error);
      }
    }
  };

  const triggerNod = () => {
    if (riveRef.current && isLoaded) {
      try {
        riveRef.current.play('nod');
      } catch (error) {
        console.error('Error triggering nod:', error);
      }
    }
  };

  const triggerHeadTilt = () => {
    if (riveRef.current && isLoaded) {
      try {
        riveRef.current.play('headTilt');
      } catch (error) {
        console.error('Error triggering head tilt:', error);
      }
    }
  };

  // Auto-trigger micro-expressions
  useEffect(() => {
    if (!isLoaded || riveState !== 'idle') return;

    const microExpressionInterval = setInterval(() => {
      const expressions = [triggerBlink, triggerNod, triggerHeadTilt];
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      randomExpression();
    }, 5000 + Math.random() * 10000); // Random interval between 5-15 seconds

    return () => clearInterval(microExpressionInterval);
  }, [isLoaded, riveState]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Rive
        ref={riveRef}
        src={require('../assets/rive/avatar-assistant.riv')}
        stateMachines="State Machine 1"
        fit={Fit.Contain}
        alignment={Alignment.Center}
        onLoad={handleRiveLoad}
        onPlay={handleAnimationFinish}
        style={styles.riveAnimation}
      />
      
      {/* Fallback for when Rive is not loaded */}
      {!isLoaded && (
        <View style={styles.fallbackContainer}>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  riveAnimation: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackAvatar: {
    width: '80%',
    height: '80%',
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