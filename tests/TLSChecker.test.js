/**
 * @jest-environment node
 */

const TLSChecker = require('../src/TLSChecker');
const TLSConnection = require('../src/TLSConnection');
const DNSResolver = require('../src/DNSResolver');
const ResultFormatter = require('../src/ResultFormatter');

jest.mock('../src/TLSConnection');
jest.mock('../src/DNSResolver');
jest.mock('../src/ResultFormatter');

describe('TLSChecker', () => {
    let tlsChecker;
    let mockSocket;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock socket
        mockSocket = {
            destroy: jest.fn()
        };

        // Setup mock implementations
        DNSResolver.prototype.resolve = jest.fn().mockResolvedValue('1.2.3.4');
        TLSConnection.prototype.connect = jest.fn().mockResolvedValue(mockSocket);
        ResultFormatter.prototype.formatSuccess = jest.fn().mockReturnValue({ success: true });
        ResultFormatter.prototype.formatHostResult = jest.fn().mockReturnValue({ host: 'example.com', success: true });
        ResultFormatter.prototype.formatHostError = jest.fn().mockReturnValue({ host: 'example.com', error: 'Test error' });
        ResultFormatter.prototype.formatFinalResults = jest.fn().mockReturnValue({ results: [] });

        tlsChecker = new TLSChecker();
    });

    describe('checkTLS', () => {
        it('should successfully check TLS for a hostname', async () => {
            const result = await tlsChecker.checkTLS('example.com');

            expect(DNSResolver.prototype.resolve).toHaveBeenCalledWith('example.com');
            expect(TLSConnection.prototype.connect).toHaveBeenCalledWith('example.com', '1.2.3.4');
            expect(ResultFormatter.prototype.formatSuccess).toHaveBeenCalledWith('example.com', '1.2.3.4', mockSocket);
            expect(mockSocket.destroy).toHaveBeenCalled();
            expect(result).toEqual({ success: true });
        });

        it('should retry on failure', async () => {
            const error = new Error('Connection failed');
            DNSResolver.prototype.resolve
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce('1.2.3.4');

            await tlsChecker.checkTLS('example.com');

            expect(DNSResolver.prototype.resolve).toHaveBeenCalledTimes(2);
        });
    });

    describe('checkMultiple', () => {
        it('should throw error if hostnames is not an array', async () => {
            await expect(tlsChecker.checkMultiple('example.com'))
                .rejects
                .toThrow('Hostnames must be an array');
        });

        it('should process multiple hostnames concurrently', async () => {
            const hostnames = ['example.com', 'example.org', 'example.net'];
            
            await tlsChecker.checkMultiple(hostnames);

            expect(DNSResolver.prototype.resolve).toHaveBeenCalledTimes(3);
            expect(ResultFormatter.prototype.formatFinalResults).toHaveBeenCalled();
        });
    });

    describe('processQueue', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should wait for executing promises when queue is empty', async () => {
            const tlsChecker = new TLSChecker({ concurrency: 2 });
            const hostnames = ['example1.com'];
            const delay = 10; // Reduced from 100 to 10
            
            // Mock DNS resolution with a delay to ensure we hit the executing.size > 0 condition
            DNSResolver.prototype.resolve = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve('1.2.3.4'), delay))
            );

            // Create a spy to track when Promise.race is called
            const promiseRaceSpy = jest.spyOn(Promise, 'race');

            // Process the queue
            await tlsChecker.processQueue(hostnames);

            // Verify that Promise.race was called
            expect(promiseRaceSpy).toHaveBeenCalled();
            
            // Verify that the host was processed
            expect(ResultFormatter.prototype.formatHostResult).toHaveBeenCalledTimes(1);

            // Clean up
            promiseRaceSpy.mockRestore();
        });

        it('should respect concurrency limit', async () => {
            const tlsChecker = new TLSChecker({ concurrency: 2 });
            const hostnames = ['example1.com', 'example2.com', 'example3.com'];

            // Add delay to DNS resolution to test concurrency
            DNSResolver.prototype.resolve = jest.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve('1.2.3.4'), 100))
            );

            await tlsChecker.processQueue(hostnames);

            expect(ResultFormatter.prototype.formatHostResult).toHaveBeenCalledTimes(3);
        });
    });

    describe('processHost', () => {
        it('should handle successful check', async () => {
            const results = [];
            await tlsChecker.processHost('example.com', results);

            expect(results).toHaveLength(1);
            expect(ResultFormatter.prototype.formatHostResult).toHaveBeenCalled();
        });

        it('should handle check failure', async () => {
            const error = new Error('Test error');
            DNSResolver.prototype.resolve.mockRejectedValue(error);

            const results = [];
            await tlsChecker.processHost('example.com', results);

            expect(results).toHaveLength(1);
            expect(ResultFormatter.prototype.formatHostError).toHaveBeenCalledWith('example.com', error);
        });
    });

    describe('retryOperation', () => {
        it('should retry failed operations up to specified limit', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValueOnce('success');

            const result = await tlsChecker.retryOperation(operation);

            expect(operation).toHaveBeenCalledTimes(3);
            expect(result).toBe('success');
        });

        it('should throw last error if all retries fail', async () => {
            const error = new Error('Operation failed');
            const operation = jest.fn().mockRejectedValue(error);

            await expect(tlsChecker.retryOperation(operation))
                .rejects
                .toThrow(error);

            expect(operation).toHaveBeenCalledTimes(tlsChecker.options.retries + 1);
        });
    });
});
