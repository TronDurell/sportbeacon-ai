// Mock TensorFlow.js
module.exports = {
  loadLayersModel: jest.fn(),
  tensor: jest.fn(),
  tidy: jest.fn((fn) => fn()),
  dispose: jest.fn(),
  ready: jest.fn().mockResolvedValue(true),
  setBackend: jest.fn(),
  getBackend: jest.fn().mockReturnValue('cpu')
};
