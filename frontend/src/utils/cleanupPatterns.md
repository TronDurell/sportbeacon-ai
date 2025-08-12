# React Cleanup Patterns - Memory Leak Prevention

This document provides comprehensive patterns for preventing memory leaks in React components by implementing proper cleanup in useEffect hooks.

## Table of Contents

1. [Firebase Listener Cleanup](#firebase-listener-cleanup)
2. [Event Listener Cleanup](#event-listener-cleanup)
3. [Timer/Interval Cleanup](#timerinterval-cleanup)
4. [WebSocket Cleanup](#websocket-cleanup)
5. [Async Operation Cleanup](#async-operation-cleanup)
6. [Component Unmount Cleanup](#component-unmount-cleanup)
7. [Memory Leak Detection](#memory-leak-detection)

## Firebase Listener Cleanup

### ✅ Good Pattern
```typescript
useEffect(() => {
  if (!userId) return;

  const unsubscribe = onSnapshot(
    doc(db, 'users', userId),
    (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    },
    (error) => {
      console.error('Error listening to user data:', error);
    }
  );

  // ✅ Proper cleanup
  return () => unsubscribe();
}, [userId]);
```

### ❌ Bad Pattern
```typescript
useEffect(() => {
  if (!userId) return;

  onSnapshot(
    doc(db, 'users', userId),
    (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    }
  );
  // ❌ No cleanup - will cause memory leaks
}, [userId]);
```

### 🔧 Advanced Pattern with Multiple Listeners
```typescript
useEffect(() => {
  if (!userId) return;

  const listeners: (() => void)[] = [];

  // User profile listener
  const userUnsubscribe = onSnapshot(
    doc(db, 'users', userId),
    (doc) => setUserData(doc.data())
  );
  listeners.push(userUnsubscribe);

  // User posts listener
  const postsUnsubscribe = onSnapshot(
    query(collection(db, 'posts'), where('authorId', '==', userId)),
    (snapshot) => setPosts(snapshot.docs.map(doc => doc.data()))
  );
  listeners.push(postsUnsubscribe);

  // ✅ Cleanup all listeners
  return () => {
    listeners.forEach(unsubscribe => unsubscribe());
  };
}, [userId]);
```

## Event Listener Cleanup

### ✅ Good Pattern
```typescript
useEffect(() => {
  const handleScroll = () => {
    setScrollPosition(window.scrollY);
  };

  window.addEventListener('scroll', handleScroll);

  // ✅ Proper cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);
```

### ❌ Bad Pattern
```typescript
useEffect(() => {
  const handleScroll = () => {
    setScrollPosition(window.scrollY);
  };

  window.addEventListener('scroll', handleScroll);
  // ❌ No cleanup - will cause memory leaks
}, []);
```

### 🔧 Advanced Pattern with Multiple Event Listeners
```typescript
useEffect(() => {
  const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  const handleScroll = () => setScrollPosition(window.scrollY);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setModalOpen(false);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll);
  document.addEventListener('keydown', handleKeyDown);

  // ✅ Cleanup all event listeners
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('keydown', handleKeyDown);
  };
}, []);
```

## Timer/Interval Cleanup

### ✅ Good Pattern
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  // ✅ Proper cleanup
  return () => clearInterval(interval);
}, []);
```

### ❌ Bad Pattern
```typescript
useEffect(() => {
  setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  // ❌ No cleanup - will cause memory leaks
}, []);
```

### 🔧 Advanced Pattern with Multiple Timers
```typescript
useEffect(() => {
  const timers: number[] = [];

  // Update time every second
  const timeInterval = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  timers.push(timeInterval);

  // Auto-save every 30 seconds
  const saveInterval = setInterval(() => {
    saveData();
  }, 30000);
  timers.push(saveInterval);

  // ✅ Cleanup all timers
  return () => {
    timers.forEach(timer => clearInterval(timer));
  };
}, []);
```

## WebSocket Cleanup

### ✅ Good Pattern
```typescript
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/ws');

  ws.onopen = () => setConnected(true);
  ws.onmessage = (event) => setMessage(JSON.parse(event.data));
  ws.onerror = (error) => setError(error);
  ws.onclose = () => setConnected(false);

  // ✅ Proper cleanup
  return () => {
    ws.close();
  };
}, []);
```

### ❌ Bad Pattern
```typescript
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/ws');
  ws.onmessage = (event) => setMessage(JSON.parse(event.data));
  // ❌ No cleanup - will cause memory leaks
}, []);
```

## Async Operation Cleanup

### ✅ Good Pattern with AbortController
```typescript
useEffect(() => {
  const abortController = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: abortController.signal
      });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError(error);
      }
    }
  };

  fetchData();

  // ✅ Proper cleanup
  return () => {
    abortController.abort();
  };
}, []);
```

### ✅ Good Pattern with Mounted Flag
```typescript
useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      
      // ✅ Check if component is still mounted
      if (isMounted) {
        setData(data);
      }
    } catch (error) {
      if (isMounted) {
        setError(error);
      }
    }
  };

  fetchData();

  // ✅ Cleanup function
  return () => {
    isMounted = false;
  };
}, []);
```

### ❌ Bad Pattern
```typescript
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    setData(data); // ❌ May set state on unmounted component
  };

  fetchData();
  // ❌ No cleanup - may cause memory leaks and state updates on unmounted component
}, []);
```

## Component Unmount Cleanup

### ✅ Good Pattern with useRef
```typescript
const MyComponent = () => {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToData((data) => {
      setData(data);
    });

    cleanupRef.current = unsubscribe;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any remaining resources
      cleanupRef.current?.();
    };
  }, []);
};
```

### ✅ Good Pattern with Multiple Resources
```typescript
const MyComponent = () => {
  const subscriptions = useRef<(() => void)[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // Add subscriptions
    const sub1 = subscribeToData1(setData1);
    const sub2 = subscribeToData2(setData2);
    subscriptions.current.push(sub1, sub2);

    // Add timers
    const timer1 = setInterval(updateTime, 1000);
    const timer2 = setInterval(autoSave, 30000);
    timers.current.push(timer1, timer2);

    // ✅ Comprehensive cleanup
    return () => {
      // Cleanup subscriptions
      subscriptions.current.forEach(unsubscribe => unsubscribe());
      subscriptions.current = [];

      // Cleanup timers
      timers.current.forEach(timer => clearInterval(timer));
      timers.current = [];
    };
  }, []);
};
```

## Memory Leak Detection

### Using Memory Leak Detector
```typescript
import { useMemoryLeakDetector } from '../utils/memoryLeakDetector';

const MyComponent = () => {
  const detector = useMemoryLeakDetector('MyComponent');

  useEffect(() => {
    // Track Firebase subscription
    const unsubscribe = onSnapshot(doc(db, 'data', 'id'), (doc) => {
      setData(doc.data());
    });
    detector.trackSubscription('firebase-data', 'firebase');

    return () => {
      unsubscribe();
      detector.untrackSubscription('firebase-data');
    };
  }, [detector]);

  useEffect(() => {
    // Track timer
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    detector.trackTimer('time-update', 'interval');

    return () => {
      clearInterval(interval);
      detector.clearTimer('time-update');
    };
  }, [detector]);
};
```

### Using Safe Utilities
```typescript
import { 
  createSafeInterval, 
  createSafeTimeout, 
  addSafeEventListener 
} from '../utils/memoryLeakDetector';

const MyComponent = () => {
  const detector = useMemoryLeakDetector('MyComponent');

  useEffect(() => {
    // Safe interval
    const intervalId = createSafeInterval(
      detector,
      () => setTime(new Date()),
      1000,
      'time-update'
    );

    // Safe event listener
    const handleScroll = () => setScrollPosition(window.scrollY);
    addSafeEventListener(detector, window, 'scroll', handleScroll);

    return () => {
      clearInterval(intervalId);
      removeSafeEventListener(detector, window, 'scroll', handleScroll);
    };
  }, [detector]);
};
```

## Best Practices

### 1. Always Return Cleanup Function
```typescript
useEffect(() => {
  // Setup code here
  
  return () => {
    // Cleanup code here
  };
}, []);
```

### 2. Use AbortController for Fetch Requests
```typescript
useEffect(() => {
  const abortController = new AbortController();
  
  fetch('/api/data', { signal: abortController.signal })
    .then(response => response.json())
    .then(data => setData(data));
  
  return () => abortController.abort();
}, []);
```

### 3. Check Component Mount Status
```typescript
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) {
      setData(data);
    }
  });
  
  return () => {
    isMounted = false;
  };
}, []);
```

### 4. Use Refs for Cleanup Functions
```typescript
const cleanupRef = useRef<(() => void) | null>(null);

useEffect(() => {
  const unsubscribe = subscribe();
  cleanupRef.current = unsubscribe;
  
  return () => {
    cleanupRef.current?.();
  };
}, []);
```

### 5. Group Related Cleanup
```typescript
useEffect(() => {
  const subscriptions: (() => void)[] = [];
  const timers: number[] = [];
  
  // Add subscriptions and timers
  subscriptions.push(subscribe1());
  subscriptions.push(subscribe2());
  timers.push(setInterval(update, 1000));
  
  return () => {
    subscriptions.forEach(unsubscribe => unsubscribe());
    timers.forEach(timer => clearInterval(timer));
  };
}, []);
```

## Common Memory Leak Sources

1. **Firebase Listeners** - Always call unsubscribe()
2. **Event Listeners** - Always removeEventListener()
3. **Timers** - Always clearInterval/clearTimeout()
4. **WebSockets** - Always close connection
5. **Fetch Requests** - Use AbortController
6. **Third-party Libraries** - Check for cleanup methods
7. **DOM References** - Clear refs on unmount
8. **Global Event Listeners** - Remove from window/document

## Testing Cleanup

### Unit Test Example
```typescript
import { render, unmountComponentAtNode } from 'react-dom';

test('cleans up on unmount', () => {
  const container = document.createElement('div');
  
  // Mock cleanup functions
  const mockUnsubscribe = jest.fn();
  const mockClearInterval = jest.fn();
  
  // Render component
  render(<MyComponent />, container);
  
  // Unmount component
  unmountComponentAtNode(container);
  
  // Verify cleanup was called
  expect(mockUnsubscribe).toHaveBeenCalled();
  expect(mockClearInterval).toHaveBeenCalled();
});
```

## Summary

- ✅ Always return cleanup functions from useEffect
- ✅ Use AbortController for fetch requests
- ✅ Check component mount status before setting state
- ✅ Group related cleanup operations
- ✅ Use memory leak detection tools in development
- ✅ Test cleanup behavior in unit tests
- ❌ Never leave subscriptions, timers, or event listeners unmanaged
- ❌ Never set state on unmounted components
- ❌ Never forget to close WebSocket connections