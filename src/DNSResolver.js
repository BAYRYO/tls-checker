const dns = require('dns').promises;

class DNSResolver {
    constructor(options) {
        this.options = options;
    }

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