import { describe, it, expect, beforeEach, jest  } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  admin: {
    auth: jest.fn(),
    firestore: jest.fn(),
  },
}));

describe('MCP Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /mcp/schema', () => {
    it('should return MCP schema', async () => {
      const response = await request(app)
        .get('/mcp/schema')
        .expect(200);

      expect(response.body).toHaveProperty('jsonrpc', '2.0');
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('tools');
      expect(Array.isArray(response.body.result.tools)).toBe(true);
    });
  });

  describe('POST /mcp', () => {
    it('should handle valid MCP request', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      };

      const response = await request(app)
        .post('/mcp')
        .send(mcpRequest)
        .expect(200);

      expect(response.body).toHaveProperty('jsonrpc', '2.0');
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('result');
    });

    it('should handle invalid MCP request', async () => {
      const invalidRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'invalid/method',
        params: {},
      };

      const response = await request(app)
        .post('/mcp')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/mcp')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
