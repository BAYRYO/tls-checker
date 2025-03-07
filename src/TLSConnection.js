const tls = require('tls');

class TLSConnection {
    constructor(options) {
        this.options = options;
    }

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