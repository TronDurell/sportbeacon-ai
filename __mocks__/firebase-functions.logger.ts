const logger = { 
  info: jest.fn(), 
  warn: jest.fn(), 
  error: jest.fn(), 
  log: jest.fn() 
};

export { logger }; 
export default logger;
