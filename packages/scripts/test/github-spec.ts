import 'jest-extended';
import { jest } from '@jest/globals';

const mockSignale = {
    pending: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

jest.unstable_mockModule('../src/helpers/signale.js', () => ({
    __esModule: true,
    default: mockSignale,
}));

const mockGot = jest.fn<() => any>();

jest.unstable_mockModule('got', () => ({
    __esModule: true,
    default: mockGot,
}));

type GithubModule = typeof import('../src/helpers/github.js');

describe('github helpers', () => {
    let getLatestTerasliceImageTag: GithubModule['getLatestTerasliceImageTag'];
    let getKindDockerImage: GithubModule['getKindDockerImage'];

    beforeAll(async () => {
        const github = await import('../src/helpers/github.js');
        getLatestTerasliceImageTag = github.getLatestTerasliceImageTag;
        getKindDockerImage = github.getKindDockerImage;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getLatestTerasliceImageTag', () => {
        const nodeMajor = process.version.slice(1).split('.')[0];
        const imageTag = `v1.2.3-nodev${nodeMajor}-ubuntu22.04`;
        const releaseBody = [
            '## Docker Images',
            '```',
            `ghcr.io/terascope/teraslice:${imageTag}`,
            '```',
        ].join('\n');

        it('should return the image tag matching the current Node major version', async () => {
            mockGot.mockResolvedValue({
                body: JSON.stringify([{ tag_name: 'v1.2.3', body: releaseBody }]),
            });

            const result = await getLatestTerasliceImageTag();
            expect(result).toBe(imageTag);
        });

        it('should throw if there are no releases', async () => {
            mockGot.mockResolvedValue({ body: JSON.stringify([]) });

            await expect(getLatestTerasliceImageTag()).rejects.toThrow(
                'Unable to determine latest Teraslice release from GitHub'
            );
        });

        it('should throw if no image matches the current Node version', async () => {
            mockGot.mockResolvedValue({
                body: JSON.stringify([{
                    tag_name: 'v1.2.3',
                    body: 'ghcr.io/terascope/teraslice:v1.2.3-nodev999-ubuntu22.04',
                }]),
            });

            await expect(getLatestTerasliceImageTag()).rejects.toThrow(
                `No Teraslice image found in release v1.2.3 for Node ${nodeMajor}`
            );
        });
    });

    describe('getKindDockerImage', () => {
        const kindReleaseBody = [
            'Some release notes',
            'Images pre-built for this release:',
            '- v1.30.0: `kindest/node:v1.30.0@sha256:abc123`',
            '- v1.29.0: `kindest/node:v1.29.0@sha256:def456`',
            '',
        ].join('\r\n');

        function makeGotMock(jsonResponse: unknown) {
            return mockGot.mockReturnValue({
                json: jest.fn<() => any>().mockResolvedValue(jsonResponse),
            });
        }

        it('should return the image for the matching k8s version', async () => {
            makeGotMock({ body: kindReleaseBody });

            const result = await getKindDockerImage('v0.24.0', 'v1.30.0');
            expect(result).toBe('kindest/node:v1.30.0@sha256:abc123');
        });

        it('should match k8s version without a leading v', async () => {
            makeGotMock({ body: kindReleaseBody });

            const result = await getKindDockerImage('v0.24.0', '1.29.0');
            expect(result).toBe('kindest/node:v1.29.0@sha256:def456');
        });

        it('should throw when the API call fails', async () => {
            mockGot.mockReturnValue({
                json: jest.fn<() => any>().mockRejectedValue(new Error('Not Found')),
            });

            await expect(getKindDockerImage('v0.24.0', 'v1.30.0')).rejects.toThrow(
                'Failed to retrieve Kind v0.24.0 release information'
            );
        });

        it('should throw when the k8s major/minor version is not in the image list', async () => {
            makeGotMock({ body: kindReleaseBody });

            await expect(getKindDockerImage('v0.24.0', 'v1.99.0')).rejects.toThrow(
                'Kind v0.24.0 has no pre-built images for kubernetes minor version'
            );
        });

        it('should throw when the image list section is missing from the release body', async () => {
            makeGotMock({ body: 'No image list here' });

            await expect(getKindDockerImage('v0.24.0', 'v1.30.0')).rejects.toThrow(
                'Could not parse github API release body for Kind v0.24.0'
            );
        });

        it('should throw when the release body is absent', async () => {
            makeGotMock({});

            await expect(getKindDockerImage('v0.24.0', 'v1.30.0')).rejects.toThrow(
                'Could not parse github API release body for Kind v0.24.0'
            );
        });

        it('should return the closest patch version when the exact patch is unavailable', async () => {
            makeGotMock({ body: kindReleaseBody });

            // v1.30.1 is not in the list, but v1.30.0 shares the same minor version
            const result = await getKindDockerImage('v0.24.0', 'v1.30.1');
            expect(result).toBe('kindest/node:v1.30.0@sha256:abc123');
        });
    });
});
