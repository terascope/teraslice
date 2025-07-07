import { execSync } from 'child_process';

// Don't leave console.logs in here

// type DiffChange = {
//     type: 'modification' | 'addition' | 'deletion';
//     before?: string;
//     after?: string;
// };

const beforeSha = process.env.GITHUB_EVENT_BEFORE || process.env.BEFORE || '';

// hello2
// eslint-disable-next-line no-console
console.log('beforeSha: ', beforeSha);

function getChangedFiles() {
    let diffOutput;
    if (!beforeSha) {
        if (process.env.IS_CI) {
            throw new Error('Missing GITHUB_EVENT_BEFORE env var.');
        } else {
            diffOutput = execSync(`git diff --name-only`, {
                encoding: 'utf8'
            });
        }
    } else {
        diffOutput = execSync(`git diff --name-only ${beforeSha}`, {
            encoding: 'utf8'
        });
    }

    return diffOutput
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

export function getFileDiff(filePath) {
    if (!beforeSha) {
        if (process.env.IS_CI) {
            throw new Error('Missing GITHUB_EVENT_BEFORE env var.');
        } else {
            try {
                const rawDiff = execSync(`git diff -- ${filePath}`, {
                    encoding: 'utf8'
                });
                return parseUnifiedDiff(rawDiff);
            } catch (err) {
                throw new Error(`Failed to get diff for file "${filePath}": ${err.message}`);
            }
        }
    } else {
        try {
            const rawDiff = execSync(`git diff ${beforeSha} -- "${filePath}"`, {
                encoding: 'utf8'
            });
            return parseUnifiedDiff(rawDiff);
        } catch (err) {
            throw new Error(`Failed to get diff for file "${filePath}": ${err.message}`);
        }
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
    // eslint-disable-next-line no-console
    console.log('changedFiles: ', changedFiles);

    function checkWebsiteTests() {
        return changedFiles.some((file) => file.startsWith('docs/'));
    }

    function checkE2eTests() {
        for (const file of changedFiles) {
            // If we come across a non docs file, run e2e
            if (!file.startsWith('docs/')) {
                return true;
            }
        }

        // but if all files were in the docs directory we skip e2e tests
        return false;
    }

    // function checkUnitTests() {
    //     // also do later
    //     return true;
    // }
    const result = {
        unit: checkE2eTests(), // For now we do the same check as e2e
        e2e: checkE2eTests(),
        website: checkWebsiteTests(),
    };

    return JSON.stringify(result);
}

// eslint-disable-next-line no-console
console.log(determineTestJobs());
