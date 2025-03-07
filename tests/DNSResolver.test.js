const dns = require('dns').promises;
const DNSResolver = require('../src/DNSResolver');

jest.mock('dns', () => ({
    promises: {
        resolve4: jest.fn()
    }
}));

describe('DNSResolver', () => {
    let resolver;
    const mockOptions = { dnsTimeout: 1000 };

    beforeEach(() => {
        resolver = new DNSResolver(mockOptions);
        jest.clearAllMocks();
    });

    describe('resolve', () => {
        it('should successfully resolve a hostname', async () => {
            const mockAddress = ['1.2.3.4'];
            dns.resolve4.mockResolvedValue(mockAddress);

            const result = await resolver.resolve('example.com');

            expect(result).toBe('1.2.3.4');
            expect(dns.resolve4).toHaveBeenCalledWith('example.com');
        });

        it('should throw error when DNS resolution fails', async () => {
            const errorMessage = 'DNS error';
            dns.resolve4.mockRejectedValue(new Error(errorMessage));

            await expect(resolver.resolve('example.com'))
                .rejects
                .toThrow('DNS resolution failed for example.com: DNS error');
        });

        it('should throw timeout error when DNS resolution takes too long', async () => {
            // Mock DNS resolution to take longer than timeout
            dns.resolve4.mockImplementation(() => new Promise(resolve => 
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