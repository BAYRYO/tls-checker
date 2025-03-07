# TLS Configuration Checker

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A powerful Node.js tool for analyzing and validating TLS configurations across multiple domains simultaneously. Perfect for security audits, monitoring, and ensuring proper TLS setup across your infrastructure.

## 🚀 Features

- **Multi-domain Support**: Check multiple domains in parallel
- **Comprehensive Analysis**: Detailed TLS configuration inspection
- **Performance Optimized**: Configurable concurrency and timeout settings
- **Rich Reporting**: Detailed analysis results with full TLS information
- **Error Resilient**: Robust error handling and reporting
- **Easy Integration**: Simple API for programmatic usage

## 📦 Installation

```bash
# Using npm
npm install tls-checker

# Using yarn
yarn add tls-checker

# Using pnpm
pnpm add tls-checker
```

## 🔧 Usage

### Basic Example

```javascript
const TLSChecker = require('./src/TLSChecker');

// Initialize the checker
const checker = new TLSChecker({
    timeout: 1000,
    concurrency: 2,
    enableTrace: false
});

// Check multiple domains
const results = await checker.checkMultiple([
    'www.github.com',
    'www.nodejs.org',
    'www.npmjs.com'
]);
```

### Advanced Usage

```javascript
const TLSChecker = require('./src/TLSChecker');

async function performTLSAudit() {
    const checker = new TLSChecker({
        timeout: 2000,
        concurrency: 5,
        enableTrace: true
    });

    try {
        const results = await checker.checkMultiple([
            'www.github.com',
            'www.nodejs.org',
            'www.npmjs.com'
        ]);

        // Process results
        for (const [domain, result] of Object.entries(results)) {
            if (result.status === 'success') {
                console.log(`✅ ${domain}: TLS configuration valid`);
            } else {
                console.log(`❌ ${domain}: ${result.error}`);
            }
        }
    } catch (error) {
        console.error('Audit failed:', error);
    }
}
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `1000` | Request timeout in milliseconds |
| `concurrency` | `number` | `1` | Number of simultaneous domain checks |
| `enableTrace` | `boolean` | `false` | Enable detailed trace logging |
| `retries` | `number` | `3` | Number of retry attempts for failed checks |

## 📝 Example Output

```json
{
    "www.github.com": {
        "status": "success",
        "tlsInfo": {
            "protocol": "TLSv1.3",
            "cipher": "TLS_AES_128_GCM_SHA256",
            "certificateInfo": {
                "issuer": "DigiCert SHA2 High Assurance Server CA",
                "validFrom": "2023-01-01T00:00:00.000Z",
                "validTo": "2024-01-01T23:59:59.999Z"
            }
        }
    }
}
```

## 🚨 Error Handling

The tool provides comprehensive error handling for various scenarios:

- **Connection Timeouts**: When a domain takes too long to respond
- **Invalid Domains**: When domain names are malformed or unresolvable
- **TLS Configuration Issues**: When TLS handshake fails or certificate is invalid
- **Network Problems**: When network connectivity issues occur

Error responses include detailed information to help diagnose issues:

```json
{
    "status": "error",
    "error": "CONNECTION_TIMEOUT",
    "message": "Connection timed out after 1000ms",
    "details": {
        "domain": "example.com",
        "timestamp": "2023-11-14T12:00:00.000Z"
    }
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Node.js TLS/SSL implementation
- OpenSSL for TLS protocol support
- Community contributors and feedback
