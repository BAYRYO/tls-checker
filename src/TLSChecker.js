const TLSConnection = require('./TLSConnection');
const DNSResolver = require('./DNSResolver');
const { validateOptions, DEFAULT_OPTIONS } = require('./config');
const ResultFormatter = require('./ResultFormatter');

/**
 * TLSChecker class for performing TLS certificate validation on hostnames
 */
class TLSChecker {
    /**
     * Creates a new TLSChecker instance
     * @param {Object} options - Configuration options for the checker
     */
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        validateOptions(this.options);
        
        this.dnsResolver = new DNSResolver(this.options);
        this.tlsConnection = new TLSConnection(this.options);
        this.resultFormatter = new ResultFormatter(this.options);
    }

    /**
     * Checks TLS certificate for a single hostname
     * @param {string} hostname - The hostname to check
     * @returns {Promise<Object>} Formatted result of the TLS check
     */
    async checkTLS(hostname) {
        return this.retryOperation(async () => {
            const ip = await this.dnsResolver.resolve(hostname);
            const socket = await this.tlsConnection.connect(hostname, ip);
            
            try {
                return this.resultFormatter.formatSuccess(hostname, ip, socket);
            } finally {
                socket.destroy();
            }
        });
    }

    /**
     * Checks TLS certificates for multiple hostnames
     * @param {string[]} hostnames - Array of hostnames to check
     * @returns {Promise<Object>} Consolidated results for all hostnames
     * @throws {Error} If hostnames parameter is not an array
     */
    async checkMultiple(hostnames) {
        if (!Array.isArray(hostnames)) {
            throw new Error('Hostnames must be an array');
        }

        const results = await this.processQueue(hostnames);
        return this.resultFormatter.formatFinalResults(results);
    }

    /**
     * Processes hostnames queue with concurrency control
     * @param {string[]} hostnames - Array of hostnames to process
     * @returns {Promise<Array>} Array of processed results
     * @private
     */
    async processQueue(hostnames) {
        const results = [];
        const queue = [...hostnames];
        const executing = new Set();

        while (queue.length > 0 || executing.size > 0) {
            while (queue.length > 0 && executing.size < this.options.concurrency) {
                const hostname = queue.shift();
                const promise = this.processHost(hostname, results);
                executing.add(promise);
                promise.finally(() => executing.delete(promise));
            }

            if (executing.size > 0) {
                await Promise.race(executing);
            }
        }

        return results;
    }

    /**
     * Processes a single hostname and adds result to results array
     * @param {string} hostname - Hostname to process
     * @param {Array} results - Array to store results
     * @returns {Promise<void>}
     * @private
     */
    async processHost(hostname, results) {
        try {
            const result = await this.checkTLS(hostname);
            results.push(this.resultFormatter.formatHostResult(hostname, result));
        } catch (error) {
            results.push(this.resultFormatter.formatHostError(hostname, error));
        }
    }

    /**
     * Retries an operation with exponential backoff
     * @param {Function} operation - Async function to retry
     * @returns {Promise<*>} Result of the operation
     * @throws {Error} Last error encountered after all retries
     * @private
     */
    async retryOperation(operation) {
        let lastError;
        let attempts = 0;
        const maxAttempts = this.options.retries + 1; // Total attempts = retries + 1 initial try
        
        while (attempts < maxAttempts) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                attempts++;
                
                // Only wait if we're going to make another attempt
                if (attempts < maxAttempts) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.options.retryDelay)
                    );
                }
            }
        }
        
        throw lastError;
    }
}

module.exports = TLSChecker;
