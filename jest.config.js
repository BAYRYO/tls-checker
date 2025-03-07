module.exports = {
  testEnvironment: 'node',
  maxWorkers: '100%',
  maxConcurrency: 20,
  testTimeout: 1000,
  verbose: true,
  bail: true,
  cache: true,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverage: true,
  transform: {},
  injectGlobals: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  silent: false
};
