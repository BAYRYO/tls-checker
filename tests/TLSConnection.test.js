const TLSConnection = require('../src/TLSConnection');
const tls = require('tls');

// First mock the module
jest.mock('tls');

// Then create the mock function explicitly
const mockConnect = jest.fn();
tls.connect = mockConnect;

describe('TLSConnection', () => {
    let tlsConnection;
    let mockSocket;
    
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Create default options
        const defaultOptions = {
            port: 443,
            timeout: 5000,
            rejectUnauthorized: true,
            enableTrace: false
        };
        
        tlsConnection = new TLSConnection(defaultOptions);
        
        // Create mock socket with EventEmitter functionality
        mockSocket = {
            destroy: jest.fn(),
            removeAllListeners: jest.fn(),
            once: jest.fn()
        };
        
        // Set up mock connect to return our mockSocket
        mockConnect.mockReturnValue(mockSocket);
    });

    describe('constructor', () => {
        it('should initialize with provided options', () => {
            const options = {
                port: 8443,
                timeout: 3000,
                rejectUnauthorized: false,
                enableTrace: true
            };
            
            const connection = new TLSConnection(options);
            expect(connection.options).toEqual(options);
        });
    });

    describe('connect', () => {
        it('should create TLS connection with correct parameters', () => {
            const hostname = 'example.com';
            const ip = '93.184.216.34';
            
            tlsConnection.connect(hostname, ip);
            
            expect(tls.connect).toHaveBeenCalledWith({
                host: ip,
                servername: hostname,
                port: 443,
                timeout: 5000,
                rejectUnauthorized: true,
                enableTrace: false
            });
        });

        // Augmenter le timeout à 10 secondes pour les tests asynchrones
        it('should resolve with socket on successful connection', async () => {
            mockSocket.once.mockImplementation((event, callback) => {
                if (event === 'secureConnect') {
                    process.nextTick(callback);
                }
            });

            const result = await tlsConnection.connect('example.com', '93.184.216.34');
            expect(result).toBe(mockSocket);
        }, 10000);

        it('should reject on timeout', async () => {
            mockSocket.once.mockImplementation((event, callback) => {
                if (event === 'timeout') {
                    process.nextTick(callback);
                }
            });

            await expect(tlsConnection.connect('example.com', '93.184.216.34'))
                .rejects
                .toThrow('Connection timed out after 5000ms');
            
            expect(mockSocket.destroy).toHaveBeenCalled();
            expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        }, 10000);

        it('should reject on error', async () => {
            const testError = new Error('Test connection error');
            
            mockSocket.once.mockImplementation((event, callback) => {
                if (event === 'error') {
                    process.nextTick(() => callback(testError));
                }
            });

            await expect(tlsConnection.connect('example.com', '93.184.216.34'))
                .rejects
                .toThrow(testError);
            
            expect(mockSocket.destroy).toHaveBeenCalled();
            expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        }, 10000);
    });

    describe('setupSocketListeners', () => {
        it('should set up all required event listeners', () => {
            const resolve = jest.fn();
            const reject = jest.fn();
            
            tlsConnection.setupSocketListeners(mockSocket, resolve, reject);
            
            expect(mockSocket.once).toHaveBeenCalledWith('timeout', expect.any(Function));
            expect(mockSocket.once).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mockSocket.once).toHaveBeenCalledWith('secureConnect', expect.any(Function));
        });
    });
});
