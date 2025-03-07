/**
 * @type {Object}
 * @property {number} timeout - Connection timeout in milliseconds
 * @property {number} port - Port number for TLS connection
 * @property {boolean} rejectUnauthorized - Whether to reject invalid certificates
 * @property {boolean} enableTrace - Enable connection tracing
 * @property {number} concurrency - Maximum number of simultaneous connections
 * @property {number} dnsTimeout - DNS resolution timeout in milliseconds
 * @property {number} retries - Number of retry attempts for failed connections
 * @property {number} retryDelay - Delay between retries in milliseconds
 */
const DEFAULT_OPTIONS = {
    timeout: 1000,
    port: 443,
    rejectUnauthorized: false,
    enableTrace: false,
    concurrency: 20,
    dnsTimeout: 1000,
    retries: 1,
    retryDelay: 100
};

/**
 * @param {Object} options - Configuration options to validate
 * @throws {Error} If any option is invalid
 */
function validateOptions(options) {
    if (typeof options.timeout !== 'number' || options.timeout <= 0) {
        throw new Error('Timeout must be a positive number');
    }
    if (typeof options.port !== 'number' || options.port <= 0) {
        throw new Error('Port must be a positive number');
    }
    if (options.concurrency <= 0) {
        throw new Error('Concurrency must be a positive number');
    }
}

module.exports = {
    DEFAULT_OPTIONS,
    validateOptions
};
