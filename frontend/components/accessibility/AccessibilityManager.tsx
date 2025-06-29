import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { AccessibilityInfo, AccessibilityRole, AccessibilityState } from 'react-native';

export interface AccessibilityConfig {
  // Visual accessibility
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  
  // Audio accessibility
  screenReader: boolean;
  voiceNavigation: boolean;
  audioDescriptions: boolean;
  volumeBoost: boolean;
  
  // Motor accessibility
  voiceControl: boolean;
  switchControl: boolean;
  touchAccommodations: boolean;
  assistiveTouch: boolean;
  
  // Cognitive accessibility
  simplifiedUI: boolean;
  autoComplete: boolean;
  errorPrevention: boolean;
  timeExtensions: boolean;
  
  // Custom settings
  fontSize: number; // 1.0 = normal, 1.2 = large, 1.5 = extra large
  lineSpacing: number; // 1.0 = normal, 1.5 = increased
  focusIndicator: 'default' | 'high' | 'custom';
  keyboardShortcuts: boolean;
}

export interface AccessibilityAnnouncement {
  id: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
}

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
  category: 'navigation' | 'interaction' | 'information' | 'system';
}

interface AccessibilityContextType {
  config: AccessibilityConfig;
  announcements: AccessibilityAnnouncement[];
  voiceCommands: VoiceCommand[];
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announce: (message: string, priority?: 'low' | 'medium' | 'high' | 'critical') => void;
  registerVoiceCommand: (command: VoiceCommand) => void;
  unregisterVoiceCommand: (commandId: string) => void;
  isScreenReaderEnabled: () => Promise<boolean>;
  getAccessibilityStyles: () => any;
  validateWCAGCompliance: () => WCAGComplianceReport;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const defaultConfig: AccessibilityConfig = {
  highContrast: false,
  largeText: false,
  reduceMotion: false,
  colorBlindness: 'none',
  screenReader: false,
  voiceNavigation: false,
  audioDescriptions: false,
  volumeBoost: false,
  voiceControl: false,
  switchControl: false,
  touchAccommodations: false,
  assistiveTouch: false,
  simplifiedUI: false,
  autoComplete: false,
  errorPrevention: false,
  timeExtensions: false,
  fontSize: 1.0,
  lineSpacing: 1.0,
  focusIndicator: 'default',
  keyboardShortcuts: false,
};

export interface WCAGComplianceReport {
  level: 'A' | 'AA' | 'AAA';
  score: number; // 0-100
  issues: WCAGIssue[];
  recommendations: string[];
  lastChecked: Date;
}

export interface WCAGIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  criterion: string;
  description: string;
  element?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix: string;
}

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultConfig);
  const [announcements, setAnnouncements] = useState<AccessibilityAnnouncement[]>([]);
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  // Initialize accessibility settings
  useEffect(() => {
    initializeAccessibility();
    loadSavedConfig();
    setupSystemListeners();
  }, []);

  // Initialize accessibility features
  const initializeAccessibility = async () => {
    try {
      // Check if screen reader is enabled
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setScreenReaderEnabled(isEnabled);
      
      // Listen for screen reader changes
      AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled);
      
      // Set up voice commands
      setupDefaultVoiceCommands();
      
    } catch (error) {
      console.error('Failed to initialize accessibility:', error);
    }
  };

  // Load saved configuration
  const loadSavedConfig = async () => {
    try {
      // Load from AsyncStorage or similar
      const savedConfig = await getSavedConfig();
      if (savedConfig) {
        setConfig({ ...defaultConfig, ...savedConfig });
      }
    } catch (error) {
      console.error('Failed to load saved accessibility config:', error);
    }
  };

  // Get saved configuration (placeholder)
  const getSavedConfig = async (): Promise<Partial<AccessibilityConfig> | null> => {
    // Implementation would use AsyncStorage or similar
    return null;
  };

  // Save configuration
  const saveConfig = async (newConfig: AccessibilityConfig) => {
    try {
      // Save to AsyncStorage or similar
      console.log('Saving accessibility config:', newConfig);
    } catch (error) {
      console.error('Failed to save accessibility config:', error);
    }
  };

  // Set up system accessibility listeners
  const setupSystemListeners = () => {
    // Listen for system accessibility changes
    if (Platform.OS === 'ios') {
      // iOS specific listeners
    } else if (Platform.OS === 'android') {
      // Android specific listeners
    }
  };

  // Set up default voice commands
  const setupDefaultVoiceCommands = () => {
    const defaultCommands: VoiceCommand[] = [
      {
        command: 'go home',
        action: () => announce('Navigating to home'),
        description: 'Navigate to the home screen',
        category: 'navigation',
      },
      {
        command: 'go back',
        action: () => announce('Going back'),
        description: 'Go back to previous screen',
        category: 'navigation',
      },
      {
        command: 'search',
        action: () => announce('Opening search'),
        description: 'Open search functionality',
        category: 'interaction',
      },
      {
        command: 'help',
        action: () => announce('Opening help menu'),
        description: 'Open help and support',
        category: 'information',
      },
      {
        command: 'settings',
        action: () => announce('Opening settings'),
        description: 'Open accessibility settings',
        category: 'system',
      },
    ];

    setVoiceCommands(defaultCommands);
  };

  // Update configuration
  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveConfig(newConfig);
    
    // Apply immediate changes
    applyAccessibilityChanges(newConfig);
  };

  // Apply accessibility changes
  const applyAccessibilityChanges = (newConfig: AccessibilityConfig) => {
    // Apply visual changes
    if (newConfig.highContrast !== config.highContrast) {
      document.documentElement.classList.toggle('high-contrast', newConfig.highContrast);
    }
    
    if (newConfig.largeText !== config.largeText) {
      document.documentElement.classList.toggle('large-text', newConfig.largeText);
    }
    
    if (newConfig.reduceMotion !== config.reduceMotion) {
      document.documentElement.classList.toggle('reduce-motion', newConfig.reduceMotion);
    }
    
    // Apply color blindness filters
    if (newConfig.colorBlindness !== config.colorBlindness) {
      document.documentElement.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
      if (newConfig.colorBlindness !== 'none') {
        document.documentElement.classList.add(newConfig.colorBlindness);
      }
    }
  };

  // Make accessibility announcement
  const announce = (message: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const announcement: AccessibilityAnnouncement = {
      id: Date.now().toString(),
      message,
      priority,
      timestamp: new Date(),
      read: false,
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Use platform-specific announcement
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else if (Platform.OS === 'android') {
      // Android specific announcement
      console.log('Android announcement:', message);
    }

    // Auto-remove old announcements
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 5000);
  };

  // Register voice command
  const registerVoiceCommand = (command: VoiceCommand) => {
    setVoiceCommands(prev => [...prev, command]);
  };

  // Unregister voice command
  const unregisterVoiceCommand = (commandId: string) => {
    setVoiceCommands(prev => prev.filter(cmd => cmd.command !== commandId));
  };

  // Check if screen reader is enabled
  const isScreenReaderEnabled = async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.error('Failed to check screen reader status:', error);
      return false;
    }
  };

  // Get accessibility styles based on current config
  const getAccessibilityStyles = () => {
    const styles: any = {};

    // Font size adjustments
    if (config.largeText || config.fontSize > 1.0) {
      styles.fontSize = `${16 * config.fontSize}px`;
      styles.lineHeight = `${24 * config.lineSpacing}px`;
    }

    // High contrast styles
    if (config.highContrast) {
      styles.backgroundColor = '#000000';
      styles.color = '#FFFFFF';
      styles.borderColor = '#FFFFFF';
    }

    // Focus indicator
    if (config.focusIndicator === 'high') {
      styles.outline = '3px solid #FF0000';
      styles.outlineOffset = '2px';
    }

    return styles;
  };

  // Validate WCAG compliance
  const validateWCAGCompliance = (): WCAGComplianceReport => {
    const issues: WCAGIssue[] = [];
    let score = 100;

    // Check for common WCAG issues
    const elements = document.querySelectorAll('*');

    elements.forEach((element) => {
      // Check for missing alt text on images
      if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
        issues.push({
          id: 'missing-alt-text',
          type: 'error',
          criterion: '1.1.1',
          description: 'Image missing alternative text',
          element: element.tagName,
          severity: 'high',
          fix: 'Add alt attribute to image',
        });
        score -= 5;
      }

      // Check for proper heading structure
      if (element.tagName.match(/^H[1-6]$/)) {
        const level = parseInt(element.tagName.charAt(1));
        const previousHeadings = Array.from(elements).filter(el => 
          el.tagName.match(/^H[1-6]$/) && 
          parseInt(el.tagName.charAt(1)) < level
        );
        
        if (level > 1 && previousHeadings.length === 0) {
          issues.push({
            id: 'heading-structure',
            type: 'warning',
            criterion: '1.3.1',
            description: 'Heading structure is not logical',
            element: element.tagName,
            severity: 'medium',
            fix: 'Ensure proper heading hierarchy (H1 -> H2 -> H3)',
          });
          score -= 3;
        }
      }

      // Check for sufficient color contrast
      const style = window.getComputedStyle(element);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      if (backgroundColor && color) {
        const contrast = calculateColorContrast(backgroundColor, color);
        if (contrast < 4.5) {
          issues.push({
            id: 'color-contrast',
            type: 'error',
            criterion: '1.4.3',
            description: 'Insufficient color contrast',
            element: element.tagName,
            severity: 'high',
            fix: 'Increase color contrast to at least 4.5:1',
          });
          score -= 5;
        }
      }
    });

    // Generate recommendations
    const recommendations = generateRecommendations(issues);

    return {
      level: score >= 90 ? 'AAA' : score >= 80 ? 'AA' : 'A',
      score: Math.max(0, score),
      issues,
      recommendations,
      lastChecked: new Date(),
    };
  };

  // Calculate color contrast ratio
  const calculateColorContrast = (bg: string, fg: string): number => {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast library
    return 4.5; // Placeholder
  };

  // Generate recommendations based on issues
  const generateRecommendations = (issues: WCAGIssue[]): string[] => {
    const recommendations: string[] = [];

    if (issues.some(issue => issue.id === 'missing-alt-text')) {
      recommendations.push('Add alternative text to all images for screen reader users');
    }

    if (issues.some(issue => issue.id === 'heading-structure')) {
      recommendations.push('Ensure proper heading hierarchy for better navigation');
    }

    if (issues.some(issue => issue.id === 'color-contrast')) {
      recommendations.push('Improve color contrast for better readability');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your content meets WCAG guidelines');
    }

    return recommendations;
  };

  const contextValue: AccessibilityContextType = {
    config,
    announcements,
    voiceCommands,
    updateConfig,
    announce,
    registerVoiceCommand,
    unregisterVoiceCommand,
    isScreenReaderEnabled,
    getAccessibilityStyles,
    validateWCAGCompliance,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Higher-order component for accessibility
export const withAccessibility = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const accessibility = useAccessibility();
    return <Component {...props} accessibility={accessibility} />;
  };
};

// Accessibility-aware button component
export const AccessibleButton: React.FC<{
  onPress: () => void;
  title: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  style?: any;
  children?: ReactNode;
}> = ({
  onPress,
  title,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  style,
  children,
}) => {
  const { config, announce } = useAccessibility();

  const handlePress = () => {
    onPress();
    if (config.screenReader) {
      announce(`Button pressed: ${title}`);
    }
  };

  const accessibleStyles = {
    ...style,
    ...getAccessibilityStyles(),
  };

  return (
    <button
      onClick={handlePress}
      style={accessibleStyles}
      aria-label={accessibilityLabel || title}
      aria-describedby={accessibilityHint}
      role={accessibilityRole}
      aria-pressed={accessibilityState?.pressed}
      aria-disabled={accessibilityState?.disabled}
    >
      {children || title}
    </button>
  );
};

// Accessibility-aware text component
export const AccessibleText: React.FC<{
  children: ReactNode;
  accessibilityRole?: AccessibilityRole;
  style?: any;
}> = ({ children, accessibilityRole = 'text', style }) => {
  const accessibleStyles = {
    ...style,
    ...getAccessibilityStyles(),
  };

  return (
    <span
      style={accessibleStyles}
      role={accessibilityRole}
    >
      {children}
    </span>
  );
};

// Voice command handler
export const useVoiceCommands = () => {
  const { voiceCommands, registerVoiceCommand, unregisterVoiceCommand } = useAccessibility();

  const handleVoiceInput = (input: string) => {
    const command = voiceCommands.find(cmd => 
      input.toLowerCase().includes(cmd.command.toLowerCase())
    );

    if (command) {
      command.action();
    }
  };

  return {
    voiceCommands,
    registerVoiceCommand,
    unregisterVoiceCommand,
    handleVoiceInput,
  };
};

// WCAG compliance checker
export const useWCAGCompliance = () => {
  const { validateWCAGCompliance } = useAccessibility();
  const [complianceReport, setComplianceReport] = useState<WCAGComplianceReport | null>(null);

  const checkCompliance = () => {
    const report = validateWCAGCompliance();
    setComplianceReport(report);
    return report;
  };

  return {
    complianceReport,
    checkCompliance,
  };
}; 