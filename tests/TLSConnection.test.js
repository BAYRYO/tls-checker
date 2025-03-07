const TLSConnection = require('../src/TLSConnection');

// Mock the tls module
jest.mock('tls', () => ({
    connect: jest.fn()
}));

const tls = require('tls');

describe('TLSConnection', () => {
    let tlsConnection;
    let mockSocket;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Create mock socket with event emitter functionality
        mockSocket = {
            destroy: jest.fn(),
            removeAllListeners: jest.fn(),
            once: jest.fn(),
        };

        // Default tls.connect implementation
        tls.connect.mockReturnValue(mockSocket);

        // Create TLSConnection instance with test options
        tlsConnection = new TLSConnection({
            port: 443,
            timeout: 5000,
            rejectUnauthorized: true,
            enableTrace: false
        });
    });

    describe('connect', () => {
        it('should create a TLS connection with correct options', async () => {
            const hostname = 'example.com';
            const ip = '1.2.3.4';

            // Setup mock socket to emit successful connection
            mockSocket.once.mockImplementation((event, callback) => {
                if (event === 'secureConnect') {
                    callback();
                }
            });

            const result = await tlsConnection.connect(hostname, ip);

            expect(tls.connect).toHaveBeenCalledWith({
                host: ip,
                servername: hostname,
                port: 443,
                timeout: 5000,
                rejectUnauthorized: true,
                enableTrace: false
            });

            expect(result).toBe(mockSocket);
        });

        it('should handle connection timeout', async () => {
            const hostname = 'example.com';
            const ip = '1.2.3.4';

            // Setup mock socket to emit timeout
            mockSocket.once.mockImplementation((event, callback) => {
                if (event === 'timeout') {
                    callback();
                }
            });

            await expect(tlsConnection.connect(hostname, ip))
                .rejects
                .toThrow('Connection timed out after 5000ms');

            expect(mockSocket.destroy).toHaveBeenCalled();
            expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        });

        it('should handle connection error', async () => {
            const hostname = 'example.com';
            const ip = '1.2.3.4';
            const testError = new Error('Test connection error');

            // Setup mock socket to emit error
            mockSocket.once.mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(testError);
                }
            });

            await expect(tlsConnection.connect(hostname, ip))
                .rejects
                .toThrow(testError);

            expect(mockSocket.destroy).toHaveBeenCalled();
            expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        });
    });
});