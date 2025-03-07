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
