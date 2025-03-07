const dns = require('node:dns/promises');

/**
 * Resolves hostnames to IP addresses using DNS
 */
class DNSResolver {
    /**
     * Creates a new DNSResolver instance
     * @param {Object} options - Configuration options for the resolver
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Resolves a hostname to an IP address using DNS
     * @param {string} hostname - The hostname to resolve
     * @returns {Promise<string>} The resolved IP address
     */
    async resolve(hostname) {
        try {
            const addresses = await Promise.race([
                dns.resolve4(hostname),
                this.createTimeout()
            ]);
            return addresses[0];
        } catch (error) {
            throw new Error(`DNS resolution failed for ${hostname}: ${error.message}`);
        }
    }

    /**
     * Creates a timeout Promise for DNS resolution
     * @returns {Promise<Error>} Promise that resolves with an Error after the timeout
     */
    createTimeout() {
        return new Promise((_, reject) => 
            setTimeout(
                () => reject(new Error('DNS lookup timeout')), 
                this.options.dnsTimeout
            )
        );
    }
}

module.exports = DNSResolver;
