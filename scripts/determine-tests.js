import { execSync } from 'child_process';

// Don't leave console.logs in here

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

try {
    baseSha = execSync(`git merge-base HEAD origin/HEAD`, {
        encoding: 'utf8'
    });
} catch (error) {
    throw new Error(`Failed to get baseSha of branch: ${error}`);
}

function getChangedFiles() {
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
