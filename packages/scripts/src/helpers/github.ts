import got from 'got';
import signale from './signale.js';

/**
 * Uses the GitHub Releases API to get the latest Teraslice version, then paginates
 * the GHCR OCI tags list to find the matching image tag for the current Node.js major
 * version. Tags are returned in push order (oldest first), so we collect all matches
 * and return the last one as the most recently published.
 */
export async function getLatestTerasliceImageTag(): Promise<string> {
    const nodeMajor = process.version.slice(1).split('.')[0];
    signale.pending(`Fetching latest Teraslice image tag for Node ${nodeMajor} from GHCR...`);

    const releasesResponse = await got('https://api.github.com/repos/terascope/teraslice/releases?per_page=1');
    const releases = JSON.parse(releasesResponse.body) as { tag_name: string }[];
    const latestVersion = releases[0]?.tag_name;

    if (!latestVersion) {
        throw new Error('Unable to determine latest Teraslice release version from GitHub');
    }

    const authResponse = await got('https://ghcr.io/token?scope=repository:terascope/teraslice:pull');
    const token = JSON.parse(authResponse.body).token;

    const matchingTags: string[] = [];
    let last: string | undefined;

    // ghcr returns tags in push order (oldest first), 100 per page.
    // Each iteration fetches the next page using the last tag as the cursor.
    // We collect all tags matching the target version + node major, excluding dev builds.
    // Loop ends when a page returns null/empty (no more tags).
    while (true) {
        const response = await got('https://ghcr.io/v2/terascope/teraslice/tags/list', {
            searchParams: last ? { last } : {},
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'json'
        });
        const tags: string[] | null = (response.body as any).tags;

        if (!tags?.length) break;

        matchingTags.push(...tags.filter((t) =>
            t.startsWith(latestVersion)
            && t.includes(`nodev${nodeMajor}`)
            && !t.includes('-dev.')
        ));

        last = tags.at(-1);
    }

    const tag = matchingTags.at(-1);

    if (!tag) {
        throw new Error(`No Teraslice image found on GHCR for ${latestVersion} and Node ${nodeMajor}`);
    }

    signale.success(`Latest Teraslice image tag: ${tag}`);
    return tag;
}
