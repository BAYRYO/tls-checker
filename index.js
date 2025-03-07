// Import the TLSChecker class from the local module
const TLSChecker = require('./src/TLSChecker');

/**
 * Main function to demonstrate TLS checking functionality
 * Initializes a TLSChecker instance and performs checks on multiple domains
 */
async function main() {
    // Create a new TLSChecker instance with configuration
    const checker = new TLSChecker({
        timeout: 1000,      // Set timeout to 1 second
        concurrency: 1,     // Process one domain at a time
        enableTrace: false  // Disable detailed trace logging
    });
    
    try {
        /** Check TLS configuration for multiple domains
         * 
         * @param {string[]} hostnames - Array of hostnames to check
         * @returns {Promise<Object>} Consolidated results for all hostnames
         */
        const results = await checker.checkMultiple([
            'www.okantis.fr',
            'www.github.com',
            'www.nodejs.org',
            'www.npmjs.com'
        ]);
        
        // Output results in formatted JSON
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        // Handle and log any errors that occur during the process
        console.error('Error:', error);
    }
}

// Execute the main function
main();
