import {
    ENCRYPT_OPENSEARCH, ROOT_CERT_PATH, OPENSEARCH_SSL_HOST,
    TEST_OPENSEARCH
} from '../../config.js';
import { execa } from 'execa';

describe('encrypted opensearch', () => {
    if (ENCRYPT_OPENSEARCH === 'true' && TEST_OPENSEARCH === 'true') {
        it('should have an encrypted connection', async () => {
            // Format string to be without protocol
            // The openssl s_client will throw if provided
            const opensearchURL
                = OPENSEARCH_SSL_HOST.startsWith('https://')
                    ? OPENSEARCH_SSL_HOST.slice(8)
                    : OPENSEARCH_SSL_HOST;

            const result = await execa({ shell: true })`printf '\\n' | openssl s_client -connect ${opensearchURL} -CAfile ${ROOT_CERT_PATH}`;
            expect(result.stdout).toContain('Verification: OK');
        });
    } else {
        // Need this here because we need at lease one test in the test suite at all times
        it('should not be encrypted', () => {
            expect(ENCRYPT_OPENSEARCH).toBe(false);
        });
    }
});
