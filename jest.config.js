module.exports = {
  testEnvironment: 'node',
  maxWorkers: '100%',
  maxConcurrency: 20,
  // Aggressive timeout reduction
  testTimeout: 1000,
  verbose: false,
  bail: true,
  cache: true,
  onlyChanged: !process.env.CI,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverage: process.env.CI === 'true',
  transform: {},
  // Add fast fail options
  bail: 1,
  // Reduce console noise
  silent: true,
  // Optimize for speed
  injectGlobals: false,
  errorOnDeprecated: false
};
