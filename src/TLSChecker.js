const TLSConnection = require('./TLSConnection');
const DNSResolver = require('./DNSResolver');
const { validateOptions, DEFAULT_OPTIONS } = require('./config');
const ResultFormatter = require('./ResultFormatter');

class TLSChecker {
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        validateOptions(this.options);
        
        this.dnsResolver = new DNSResolver(this.options);
        this.tlsConnection = new TLSConnection(this.options);
        this.resultFormatter = new ResultFormatter(this.options);
    }

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

    async checkMultiple(hostnames) {
        if (!Array.isArray(hostnames)) {
            throw new Error('Hostnames must be an array');
        }

        const results = await this.processQueue(hostnames);
        return this.resultFormatter.formatFinalResults(results);
    }

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

    async processHost(hostname, results) {
        try {
            const result = await this.checkTLS(hostname);
            results.push(this.resultFormatter.formatHostResult(hostname, result));
        } catch (error) {
            results.push(this.resultFormatter.formatHostError(hostname, error));
        }
    }

    async retryOperation(operation) {
        let lastError;
        for (let i = 0; i <= this.options.retries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (i < this.options.retries) {
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