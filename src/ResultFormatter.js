/**
 * Formats and structures TLS check results
 */
class ResultFormatter {
    /**
     * Creates a new ResultFormatter instance
     * @param {Object} options - Configuration options for the formatter
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Formats successful TLS connection results
     * @param {string} hostname - The hostname that was checked
     * @param {string} ip - The IP address that was connected to
     * @param {import('node:tls').TLSSocket} socket - The TLS socket connection
     * @returns {Object} Formatted success result containing TLS and certificate details
     */
    formatSuccess(hostname, ip, socket) {
        const cert = socket.getPeerCertificate(true);
        return {
            timestamp: new Date().toISOString(),
            hostname,
            ip,
            tls: {
                version: socket.getProtocol(),
                cipher: socket.getCipher().name,
                authorized: socket.authorized
            },
            certificate: {
                subject: cert.subject.CN,
                issuer: cert.issuer.CN,
                validFrom: cert.valid_from,
                validTo: cert.valid_to,
                altNames: this.parseAltNames(cert.subjectaltname)
            }
        };
    }

    /**
     * Parses certificate alternative names into an array
     * @param {string} altNames - Comma-separated string of alternative names
     * @returns {string[]} Array of parsed alternative names
     * @private
     */
    parseAltNames(altNames) {
        if (!altNames) return [];
        return altNames.split(', ')
            .map(name => name.startsWith('DNS:') ? name.slice(4) : name);
    }

    /**
     * Formats a successful host check result
     * @param {string} hostname - The hostname that was checked
     * @param {Object} data - The TLS check result data
     * @returns {Object} Formatted host result with success status
     */
    formatHostResult(hostname, data) {
        return {
            hostname,
            status: 'success',
            ...data
        };
    }

    /**
     * Formats an error result for a host check
     * @param {string} hostname - The hostname that failed checking
     * @param {Error} error - The error that occurred
     * @returns {Object} Formatted host result with error status and details
     */
    formatHostError(hostname, error) {
        return {
            hostname,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Formats final results for multiple host checks
     * @param {Object[]} results - Array of individual host check results
     * @returns {Object} Consolidated results with summary statistics
     */
    formatFinalResults(results) {
        return {
            summary: {
                total: results.length,
                successful: results.filter(r => r.status === 'success').length,
                failed: results.filter(r => r.status === 'error').length
            },
            scans: results,
            scanTime: new Date().toISOString()
        };
    }
}

module.exports = ResultFormatter;
