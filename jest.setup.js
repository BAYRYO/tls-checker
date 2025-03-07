// Set up any global test configuration
beforeAll(() => {
  jest.setTimeout(1000);
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
