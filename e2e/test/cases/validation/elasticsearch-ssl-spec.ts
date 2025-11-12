import { config } from '../../config.js';
import { execa } from 'execa';

const {
    ENCRYPT_OPENSEARCH, ROOT_CERT_PATH,
    SEARCH_TEST_HOST, TEST_OPENSEARCH
} = config;

describe('encrypted opensearch', () => {
    if (ENCRYPT_OPENSEARCH === 'true' && TEST_OPENSEARCH === 'true') {
        it('should have an encrypted connection', async () => {
            // Format string to be without protocol
            // The openssl s_client will throw if provided
            const opensearchURL
                = SEARCH_TEST_HOST.startsWith('https://')
                    ? SEARCH_TEST_HOST.slice(8)
                    : SEARCH_TEST_HOST;

            const result = await execa({ shell: true })`printf '\\n' | openssl s_client -connect ${opensearchURL} -CAfile ${ROOT_CERT_PATH}`;
            expect(result.stdout).toContain('Verification: OK');
        });
    } else {
        // Need this here because we need at lease one test in the test suite at all times
        it('should not be encrypted', () => {
            expect(ENCRYPT_OPENSEARCH).not.toBe(true);
        });
    }
});
