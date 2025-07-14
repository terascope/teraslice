import { execSync } from 'child_process';

// TODO: Maybe add to ts-scripts and add testing to exported functions

// type DiffChange = {
//     type: 'modification' | 'addition' | 'deletion';
//     before?: string;
//     after?: string;
// };

// We can use this later when we want to make this more complex
// Add this to the determine-tests job in the test.yaml to fet this variable
//
// BEFORE=$(jq -r .before "$GITHUB_EVENT_PATH")
// export BEFORE
// echo "$BEFORE"
//
// const beforeSha = process.env.GITHUB_EVENT_BEFORE || process.env.BEFORE || '';

let baseSha;

const currentBranch = getBranchName();

if (currentBranch === 'master') {
    // If we are on the master branch (for example after a merge), run all tests
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
        unit: true,
        integration: true,
        e2e: true,
        website: true
    }));
} else {
    try {
        baseSha = execSync(`git merge-base HEAD origin/HEAD`, {
            encoding: 'utf8'
        });
    } catch (error) {
        throw new Error(`Failed to get baseSha of branch: ${error}`);
    }

    // eslint-disable-next-line no-console
    console.log(determineTestJobs());
}

export function getChangedFiles() {
    const diffOutput = execSync(`git diff --name-only ${baseSha}`, {
        encoding: 'utf8'
    });

    return diffOutput
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

export function getFileDiff(filePath) {
    try {
        const rawDiff = execSync(`git diff ${baseSha} -- "${filePath}"`, {
            encoding: 'utf8'
        });
        return parseUnifiedDiff(rawDiff);
    } catch (err) {
        throw new Error(`Failed to get diff for file "${filePath}": ${err.message}`);
    }
}

export function parseUnifiedDiff(diff) {
    const lines = diff.split('\n');
    const changes = [];

    let pendingDeletes = [];
    let pendingAdds = [];

    function flushPending() {
        const max = Math.max(pendingDeletes.length, pendingAdds.length);
        for (let i = 0; i < max; i++) {
            const before = pendingDeletes[i];
            const after = pendingAdds[i];

            if (before !== undefined && after !== undefined) {
                changes.push({ type: 'modification', before, after });
            } else if (before !== undefined) {
                changes.push({ type: 'deletion', before });
            } else if (after !== undefined) {
                changes.push({ type: 'addition', after });
            }
        }
        pendingDeletes = [];
        pendingAdds = [];
    }

    for (const line of lines) {
        if (
            line.startsWith('diff ')
            || line.startsWith('index ')
            || line.startsWith('--- ')
            || line.startsWith('+++ ')
            || line.startsWith('@@')
        ) {
            flushPending();
            continue;
        }

        if (line.startsWith('-')) {
            pendingDeletes.push(line.slice(1).trimEnd());
        } else if (line.startsWith('+')) {
            pendingAdds.push(line.slice(1).trimEnd());
        } else {
            flushPending();
        }
    }

    // Flush any remaining changes
    flushPending();

    return changes;
}

function determineTestJobs() {
    const changedFiles = getChangedFiles();

    function checkWebsiteTests() {
        // Always run website tests for now
        return true;
    }

    function checkE2eTests() {
        // If every file is a docs change, don't run e2e
        return !changedFiles.every((file) => file.startsWith('docs/'));
    }

    function checkUnitTests() {
        // If every file is a docs change, don't run unit
        return !changedFiles.every((file) => file.startsWith('docs/'));
    }

    function checkIntegrationTests() {
        // If every file is a docs change, don't run integration
        return !changedFiles.every((file) => file.startsWith('docs/'));
    }
    const result = {
        unit: checkUnitTests(),
        integration: checkIntegrationTests(),
        e2e: checkE2eTests(),
        website: checkWebsiteTests()
    };

    return JSON.stringify(result);
}

function getBranchName() {
    const eventName = process.env.GITHUB_EVENT_NAME;
    const refName = process.env.GITHUB_REF_NAME;
    const headRef = process.env.GITHUB_HEAD_REF;

    if (eventName === 'pull_request' && headRef) {
        return headRef;
    }

    if (refName) {
        return refName;
    }

    // Fallback: use git directly
    return execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8'
    }).trim();
}
