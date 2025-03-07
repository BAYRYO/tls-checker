const tls = require('node:tls');

/**
 * Handles TLS connections with configurable options
 */
class TLSConnection {
    /**
     * Creates a new TLS connection instance
     * @param {Object} options - Configuration options for TLS connection
     * @param {number} options.port - Port number for the connection
     * @param {number} options.timeout - Connection timeout in milliseconds
     * @param {boolean} options.rejectUnauthorized - Whether to reject invalid certificates
     * @param {boolean} options.enableTrace - Enable connection tracing
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Establishes a TLS connection to the specified host
     * @param {string} hostname - The hostname to connect to
     * @param {string} ip - The IP address to connect to
     * @returns {Promise<tls.TLSSocket>} Connected TLS socket
     * @throws {Error} If connection fails or times out
     */
    connect(hostname, ip) {
        return new Promise((resolve, reject) => {
            const socket = tls.connect({
                host: ip,
                servername: hostname,
                port: this.options.port,
                timeout: this.options.timeout,
                rejectUnauthorized: this.options.rejectUnauthorized,
                enableTrace: this.options.enableTrace
            });

            this.setupSocketListeners(socket, resolve, reject);
        });
    }

    /**
     * Sets up event listeners for the TLS socket
     * @param {tls.TLSSocket} socket - The TLS socket to setup
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     * @private
     */
    setupSocketListeners(socket, resolve, reject) {
        const cleanup = () => {
            socket.removeAllListeners();
            socket.destroy();
        };

        socket.once('timeout', () => {
            cleanup();
            reject(new Error(`Connection timed out after ${this.options.timeout}ms`));
        });

        socket.once('error', (error) => {
            cleanup();
            reject(error);
        });

        socket.once('secureConnect', () => {
            resolve(socket);
        });
    }
}

module.exports = TLSConnection;
