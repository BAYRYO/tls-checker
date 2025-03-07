const { DEFAULT_OPTIONS, validateOptions } = require('../src/config');

describe('Config', () => {
    // Group simple validation tests together using describe.each
    describe.each([
        ['timeout', -1, 'Timeout must be a positive number'],
        ['timeout', 0, 'Timeout must be a positive number'],
        ['timeout', 'invalid', 'Timeout must be a positive number'],
        ['port', -1, 'Port must be a positive number'],
        ['port', 0, 'Port must be a positive number'],
        ['port', 'invalid', 'Port must be a positive number'],
        ['concurrency', 0, 'Concurrency must be a positive number'],
        ['concurrency', -1, 'Concurrency must be a positive number']
    ])('validateOptions %s validation', (field, value, expectedError) => {
        test.concurrent(`should throw when ${field} is ${value}`, () => {
            const options = {
                timeout: 1000,
                port: 443,
                concurrency: 1
            };
            options[field] = value;
            
            expect(() => validateOptions(options))
                .toThrow(expectedError);
        });
    });

    // Simple object comparison can run concurrently
    test.concurrent('DEFAULT_OPTIONS should have correct values', () => {
        expect(DEFAULT_OPTIONS).toEqual({
            timeout: 1000,
            port: 443,
            rejectUnauthorized: false,
            enableTrace: false,
            concurrency: 20,
            dnsTimeout: 1000,
            retries: 1,
            retryDelay: 100
        });
    });

    // Valid options test can run concurrently
    test.concurrent('validateOptions should not throw for valid options', () => {
        const validOptions = {
            timeout: 1000,
            port: 443,
            concurrency: 1
        };
        expect(() => validateOptions(validOptions)).not.toThrow();
    });
});
