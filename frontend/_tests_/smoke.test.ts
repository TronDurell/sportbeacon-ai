import { createMemoryClient } from '@sportbeacon/memory-sdk';

describe('SDK Import Smoke Test', () => {
  test('SDK imports without errors', () => {
    expect(createMemoryClient).toBeDefined();
    expect(typeof createMemoryClient).toBe('function');
  });

  test('PWA icons present', () => {
    const iconPaths = ['/icons/icon-192.png', '/icons/icon-512.png'];
    iconPaths.forEach(path => {
      expect(path).toMatch(/^\/icons\/icon-\d+\.png$/);
    });
  });

  test('Memory client can be instantiated', () => {
    const client = createMemoryClient();
    expect(client).toBeDefined();
    expect(typeof client.writeEvent).toBe('function');
  });
});
