module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/database/migrations/**',
    '!src/template/examples/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};