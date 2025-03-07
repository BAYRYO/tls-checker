// First, set up the mock before any imports
const mockResolve4 = jest.fn();
jest.mock('dns', () => ({
    promises: {
        resolve4: mockResolve4
    }
}));

// Then import the module under test
const DNSResolver = require('../src/DNSResolver');

describe('DNSResolver', () => {
    let resolver;
    const mockOptions = { dnsTimeout: 1000 };

    beforeEach(() => {
        // Reset all mocks and create new resolver instance
        jest.clearAllMocks();
        resolver = new DNSResolver(mockOptions);
    });

    describe('resolve', () => {
        it('should successfully resolve a hostname', async () => {
            const mockAddress = ['1.2.3.4'];
            mockResolve4.mockResolvedValueOnce(mockAddress);

            const result = await resolver.resolve('example.com');

            expect(result).toBe('1.2.3.4');
            expect(mockResolve4).toHaveBeenCalledWith('example.com');
        });

        it('should throw error when DNS resolution fails', async () => {
            const errorMessage = 'DNS error';
            mockResolve4.mockRejectedValueOnce(new Error(errorMessage));

            await expect(resolver.resolve('example.com'))
                .rejects
                .toThrow('DNS resolution failed for example.com: DNS error');
        });

        it('should throw timeout error when DNS resolution takes too long', async () => {
            // Mock DNS resolution to take longer than timeout
            mockResolve4.mockImplementationOnce(() => new Promise(resolve => 
                setTimeout(() => resolve(['1.2.3.4']), 2000)
            ));

            await expect(resolver.resolve('example.com'))
                .rejects
                .toThrow('DNS resolution failed for example.com: DNS lookup timeout');
        });
    });

    describe('createTimeout', () => {
        it('should create a promise that rejects after specified timeout', async () => {
            const timeoutPromise = resolver.createTimeout();

            await expect(timeoutPromise)
                .rejects
                .toThrow('DNS lookup timeout');
        });
    });
});
