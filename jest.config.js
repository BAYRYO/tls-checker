module.exports = {
  testEnvironment: 'node',
  maxWorkers: '50%', // Use 50% of available CPU cores
  maxConcurrency: 5,
  verbose: false,
  bail: true, // Stop running tests after first failure
  testTimeout: 5000, // Reduce default timeout from 5s to 1s
  // Only search for test files in the tests directory
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // Ignore coverage collection for faster runs during development
  collectCoverage: process.env.CI === 'true',
  transform: {},
  // Cache test results for faster reruns
  cache: true,
  // Only run tests related to changed files
  onlyChanged: process.env.CI !== 'true'
};