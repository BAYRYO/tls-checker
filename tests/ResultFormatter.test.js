const ResultFormatter = require('../src/ResultFormatter');

describe('ResultFormatter', () => {
    let formatter;
    let mockSocket;
    let mockCertificate;

    beforeEach(() => {
        formatter = new ResultFormatter({});
        
        // Mock certificate data
        mockCertificate = {
            subject: { CN: 'example.com' },
            issuer: { CN: 'Test CA' },
            valid_from: '2023-01-01',
            valid_to: '2024-01-01',
            subjectaltname: 'DNS:example.com, DNS:www.example.com'
        };

        // Mock socket with required methods
        mockSocket = {
            getPeerCertificate: jest.fn().mockReturnValue(mockCertificate),
            getProtocol: jest.fn().mockReturnValue('TLSv1.2'),
            getCipher: jest.fn().mockReturnValue({ name: 'ECDHE-RSA-AES128-GCM-SHA256' }),
            authorized: true
        };
    });

    describe('formatSuccess', () => {
        it('should format successful TLS check results', () => {
            const result = formatter.formatSuccess('example.com', '1.2.3.4', mockSocket);

            expect(result).toMatchObject({
                hostname: 'example.com',
                ip: '1.2.3.4',
                tls: {
                    version: 'TLSv1.2',
                    cipher: 'ECDHE-RSA-AES128-GCM-SHA256',
                    authorized: true
                },
                certificate: {
                    subject: 'example.com',
                    issuer: 'Test CA',
                    validFrom: '2023-01-01',
                    validTo: '2024-01-01',
                    altNames: ['example.com', 'www.example.com']
                }
            });
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('parseAltNames', () => {
        it('should parse DNS names correctly', () => {
            const altNames = 'DNS:example.com, DNS:www.example.com';
            const result = formatter.parseAltNames(altNames);
            expect(result).toEqual(['example.com', 'www.example.com']);
        });

        it('should return empty array for undefined input', () => {
            const result = formatter.parseAltNames(undefined);
            expect(result).toEqual([]);
        });

        it('should handle non-DNS names', () => {
            const altNames = 'DNS:example.com, IP:192.168.1.1';
            const result = formatter.parseAltNames(altNames);
            expect(result).toEqual(['example.com', 'IP:192.168.1.1']);
        });
    });

    describe('formatHostResult', () => {
        it('should format host results correctly', () => {
            const data = { someKey: 'someValue' };
            const result = formatter.formatHostResult('example.com', data);
            expect(result).toEqual({
                hostname: 'example.com',
                status: 'success',
                someKey: 'someValue'
            });
        });
    });

    describe('formatHostError', () => {
        it('should format host errors correctly', () => {
            const error = new Error('Connection failed');
            const result = formatter.formatHostError('example.com', error);
            
            expect(result).toMatchObject({
                hostname: 'example.com',
                status: 'error',
                error: 'Connection failed'
            });
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('formatFinalResults', () => {
        it('should format final results correctly', () => {
            const testResults = [
                { status: 'success', data: 'test1' },
                { status: 'error', data: 'test2' },
                { status: 'success', data: 'test3' }
            ];

            const result = formatter.formatFinalResults(testResults);

            expect(result).toMatchObject({
                summary: {
                    total: 3,
                    successful: 2,
                    failed: 1
                },
                scans: testResults
            });
            expect(result.scanTime).toBeDefined();
        });
    });
});