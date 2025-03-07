const TLSChecker = require('./src/TLSChecker');

async function main() {
    const checker = new TLSChecker({
        timeout: 3000,
        concurrency: 3
    });
    
    try {
        const results = await checker.checkMultiple([
            'www.github.com',
            'www.nodejs.org',
            'www.npmjs.com'
        ]);
        
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
