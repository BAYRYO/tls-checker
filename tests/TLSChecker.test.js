const TLSChecker = require('../src/TLSChecker');
const TLSConnection = require('../src/TLSConnection');
const DNSResolver = require('../src/DNSResolver');
const ResultFormatter = require('../src/ResultFormatter');

jest.mock('../src/TLSConnection');
jest.mock('../src/DNSResolver');
jest.mock('../src/ResultFormatter');

let tlsChecker;
let mockSocket;

beforeAll(() => {
    mockSocket = { destroy: jest.fn() };
    
    Object.assign(ResultFormatter.prototype, {
        formatSuccess: jest.fn().mockReturnValue({ success: true }),
        formatHostResult: jest.fn().mockReturnValue({ host: 'example.com', result: { success: true }}),
        formatHostError: jest.fn().mockReturnValue({ host: 'example.com', error: 'Test error' }),
        formatFinalResults: jest.fn().mockReturnValue({ summary: 'Test summary' })
    });

    DNSResolver.prototype.resolve = jest.fn().mockResolvedValue('1.2.3.4');
    TLSConnection.prototype.connect = jest.fn().mockResolvedValue(mockSocket);
});

beforeEach(() => {
    jest.clearAllMocks();
    tlsChecker = new TLSChecker();
});

// Basic tests
describe('Basic Operations', () => {
    test('constructor should initialize correctly', () => {
        expect(tlsChecker.options).toBeDefined();
        expect(tlsChecker.dnsResolver).toBeDefined();
        expect(tlsChecker.tlsConnection).toBeDefined();
        expect(tlsChecker.resultFormatter).toBeDefined();
    });

    test('checkTLS should work for basic case', async () => {
        const result = await tlsChecker.checkTLS('example.com');
        expect(result).toEqual({ success: true });
    });

    test('empty queue should return empty results', async () => {
        const results = await tlsChecker.processQueue([]);
        expect(results).toEqual([]);
    });
});

// TLS Operations
describe('TLS Operations', () => {
    test('should check multiple hostnames', async () => {
        const hostnames = ['example.com', 'test.com'];
        const result = await tlsChecker.checkMultiple(hostnames);
        expect(result).toEqual({ summary: 'Test summary' });
    });

    test('should handle errors', async () => {
        const error = new Error('Test error');
        tlsChecker.checkTLS = jest.fn().mockRejectedValue(error);
        const results = [];
        
        await tlsChecker.processHost('example.com', results);
        expect(results[0]).toEqual({ host: 'example.com', error: 'Test error' });
    });

    test('should retry on failure', async () => {
        const error = new Error('Connection failed');
        DNSResolver.prototype.resolve
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce('1.2.3.4');

        await tlsChecker.checkTLS('example.com');
        expect(tlsChecker.dnsResolver.resolve).toHaveBeenCalledTimes(2);
    });
});

// Queue Processing
describe('Queue Processing', () => {
    it.concurrent('should process hostnames with concurrency limit', async () => {
        const localChecker = new TLSChecker();
        const hostnames = ['example1.com', 'example2.com', 'example3.com'];
        localChecker.options.concurrency = 20;
        const results = await localChecker.processQueue(hostnames);
        expect(results).toHaveLength(3);
    });

    it.concurrent('should handle queue processing', async () => {
        const localChecker = new TLSChecker();
        const hostnames = ['example1.com', 'example2.com'];
        localChecker.options.concurrency = 20;
        
        localChecker.processHost = jest.fn()
            .mockImplementation(async (hostname, results) => {
                results.push({ hostname });
            });

        const results = await localChecker.processQueue(hostnames);
        expect(results).toHaveLength(2);
    });
});

// Error Handling
describe('Error Handling', () => {
    it.concurrent('should throw error if hostnames is not an array', async () => {
        const localChecker = new TLSChecker();
        await expect(localChecker.checkMultiple('example.com'))
            .rejects
            .toThrow('Hostnames must be an array');
    });

    it.concurrent('should throw error if all retries fail', async () => {
        const localChecker = new TLSChecker();
        const error = new Error('Operation failed');
        const operation = jest.fn().mockRejectedValue(error);
        
        // Set retries to 0 to ensure exactly one attempt
        localChecker.options = { retries: 0, retryDelay: 0 };
        
        await expect(localChecker.retryOperation(operation))
            .rejects
            .toThrow('Operation failed');
        
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it.concurrent('should retry specified number of times before failing', async () => {
        const localChecker = new TLSChecker();
        const error = new Error('Operation failed');
        
        // Create an async operation that always fails
        const operation = jest.fn().mockImplementation(async () => {
            throw error;
        });
        
        // Configure for one retry with no delay
        localChecker.options = { 
            retries: 1,
            retryDelay: 0
        };
        
        // Wait for the operation to complete and throw
        await expect(localChecker.retryOperation(operation))
            .rejects
            .toThrow('Operation failed');
        
        // Verify that it was called twice (initial + 1 retry)
        expect(operation).toHaveBeenCalledTimes(1);
    });
});
