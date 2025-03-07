const DEFAULT_OPTIONS = {
    timeout: 5000,
    port: 443,
    rejectUnauthorized: false,
    enableTrace: false,
    concurrency: 5,
    dnsTimeout: 3000,
    retries: 2,
    retryDelay: 1000
};

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