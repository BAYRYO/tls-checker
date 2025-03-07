class ResultFormatter {
    constructor(options) {
        this.options = options;
    }

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

    parseAltNames(altNames) {
        if (!altNames) return [];
        return altNames.split(', ')
            .map(name => name.startsWith('DNS:') ? name.slice(4) : name);
    }

    formatHostResult(hostname, data) {
        return {
            hostname,
            status: 'success',
            ...data
        };
    }

    formatHostError(hostname, error) {
        return {
            hostname,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }

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
