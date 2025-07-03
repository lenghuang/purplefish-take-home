// Jest setup file for common configurations
// Set longer timeout for database operations
jest.setTimeout(30000);

// Mock environment variables if needed
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';