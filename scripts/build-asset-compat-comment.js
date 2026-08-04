/**
 * Builds the PR comment body for the `e2e-assets-from-source-tests` job in
 * .github/workflows/test.yml.
 *
 * That job answers a question about code nobody in this PR is looking at -- do the
 * asset repos still build and run against these packages -- so it reports rather
 * than gates: the step that runs the suite is `continue-on-error`, and this comment
 * is the only place the answer shows up.
 *
 * Input is the directory both matrix entries' artifacts get downloaded into, holding
 * two files per entry:
 *
 *   <label>.json       what the job recorded: the pnpm script it ran and the
 *                      outcome of the step that ran it. Always written.
 *   <label>.jest.json  jest's `--json` report. Missing when the run died before jest
 *                      produced results -- an asset build that throws in
 *                      global.setup does exactly that, and "no report" has to read
 *                      differently from "no failures".
 *
 * Usage:
 *   node ./scripts/build-asset-compat-comment.js <results-dir> > comment-body.md
 *
 * The footer comes from the usual GITHUB_* variables, and is left off entirely when
 * they are absent, so running this by hand against a downloaded results directory
 * works. When $GITHUB_OUTPUT is set, `has-findings=<bool>` is appended to it: the
 * workflow updates an existing comment unconditionally, so a PR that gets fixed
 * stops showing a stale failure, but only *creates* one when there is something to
 * report.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * The matrix entries, in the order they should appear, and what each one is testing
 * against. The prose is here because only the workflow knows it -- nothing about the
 * command name says which Teraslice it loads the assets into. An unlisted entry
 * still reports, just under its bare command name.
 */
const ENTRIES = {
    'test:assetsFromSource': {
        teraslice: 'built from this PR',
    },
    'test:assetsFromSourceAgainstLatestTS': {
        teraslice: 'a published release',
    },
};

const MAX_FAILURES_LISTED = 15;
const MAX_MESSAGE_LINES = 12;
const MAX_MESSAGE_CHARS = 700;
/** GitHub rejects a comment body over 65536 characters outright. */
const MAX_BODY_CHARS = 60000;
/**
 * ts-scripts forces color on unless FORCE_COLOR says otherwise, and it defaults to
 * on, so failure messages arrive full of escape codes that a comment renders as
 * garbage.
 */
// eslint-disable-next-line no-control-regex
const ANSI = /\u001B\[[0-9;]*m/g;

function entryInfo(command) {
    return ENTRIES[command] ?? { teraslice: 'unknown' };
}

function entryOrder(command) {
    const index = Object.keys(ENTRIES).indexOf(command);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * A missing or unreadable results directory is a normal outcome, not an error: the
 * matrix job can be cancelled before it uploads anything, and the download step is
 * itself `continue-on-error` because download-artifact treats a pattern that matches
 * nothing as a failure.
 */
function readResults(dir) {
    let names;
    try {
        names = fs.readdirSync(dir);
    } catch {
        return [];
    }

    return names
        .filter((name) => name.endsWith('.json') && !name.endsWith('.jest.json'))
        .map((name) => {
            const meta = readJSON(path.join(dir, name));
            const reportPath = path.join(dir, `${meta.label}.jest.json`);

            let report = null;
            let reportError = null;
            if (fs.existsSync(reportPath)) {
                try {
                    report = readJSON(reportPath);
                } catch (err) {
                    reportError = err.message;
                }
            }

            return { ...meta, report, reportError };
        })
        .sort((a, b) => entryOrder(a.command) - entryOrder(b.command));
}

/**
 * Pulls the failing tests out of a jest report. A suite that threw on the way in --
 * a transpile error, a beforeAll that rejected -- has no assertionResults at all,
 * only a `message`, and that is exactly the failure worth reading, so it gets an
 * entry of its own rather than being dropped for having no failing tests.
 */
function getFailures(report) {
    const failures = [];

    for (const suite of report.testResults ?? []) {
        const file = path.basename(suite.name ?? 'unknown');
        const failed = (suite.assertionResults ?? []).filter((test) => test.status === 'failed');

        if (!failed.length) {
            if (suite.status === 'failed') {
                failures.push({ file, title: 'suite failed to run', message: suite.message ?? '' });
            }
            continue;
        }

        for (const test of failed) {
            failures.push({
                file,
                title: test.fullName || test.title,
                message: (test.failureMessages ?? []).join('\n\n'),
            });
        }
    }

    return failures;
}

/**
 * Four states, not two. "The step failed" and "a test failed" are different answers
 * -- the first usually means an asset never got built -- and a matrix entry that
 * never ran has to be distinguishable from one that ran clean.
 */
function classify(result) {
    const { outcome, report, reportError } = result;

    if (outcome !== 'success' && outcome !== 'failure') {
        return {
            status: 'notRun',
            failures: [],
            note: `the step never ran (${outcome}), so an earlier step in the job failed`,
        };
    }

    if (!report) {
        // Either the run never reached the end of jest, or it did and the report was
        // unreadable. Both mean the same thing here: no per-test detail to show.
        return {
            status: outcome === 'success' ? 'clean' : 'errored',
            failures: [],
            note: reportError
                ? `jest's report could not be parsed: ${reportError}`
                : 'the run produced no jest report, so it failed before or during setup',
        };
    }

    const failures = getFailures(report);
    if (failures.length) return { status: 'failing', failures };

    // No failing test, but the step still failed -- a teardown error, or ts-scripts
    // failing after the suite. Its own state rather than green.
    if (outcome === 'failure') {
        return {
            status: 'errored',
            failures: [],
            note: 'no test failed, but the step running the suite still failed -- see the run logs',
        };
    }

    return { status: 'clean', failures: [] };
}

function resultCell({ status, report }) {
    if (status === 'clean') {
        return report ? `passed (${report.numPassedTests} tests)` : 'passed';
    }
    if (status === 'failing') {
        return `**${report.numFailedTests} of ${report.numTotalTests} failed**`;
    }
    if (status === 'notRun') {
        return 'did not run';
    }
    return '**errored**';
}

function failingFiles({ failures }) {
    if (!failures.length) return 'none';
    const files = [...new Set(failures.map((failure) => failure.file))];
    return files.map((file) => `\`${file}\``).join(', ');
}

/**
 * Reduces a jest failure message to the part worth reading in a comment: the
 * assertion, and the frames in the spec itself. Everything from the first
 * node_modules frame on is jest's own machinery, which is the bulk of the message
 * and says nothing about what broke.
 */
function formatMessage(message) {
    const lines = [];
    let dropped = false;

    // Runner paths are absolute and long enough to wrap the whole comment.
    const workspace = process.env.GITHUB_WORKSPACE;
    const plain = workspace
        ? message.replace(ANSI, '').replaceAll(`${workspace}/`, '')
        : message.replace(ANSI, '');

    for (const line of plain.split('\n')) {
        if (/^\s+at\s.*node_modules/.test(line) || lines.length >= MAX_MESSAGE_LINES) {
            dropped = true;
            break;
        }
        lines.push(line);
    }

    let text = lines.join('\n').trimEnd();
    if (text.length > MAX_MESSAGE_CHARS) {
        text = text.slice(0, MAX_MESSAGE_CHARS);
        dropped = true;
    }

    return dropped ? `${text}\n[trimmed]` : text;
}

function detailsFor(result, { withMessages }) {
    const lines = [
        '<details>',
        `<summary><code>${result.command}</code></summary>`,
        '',
    ];

    if (result.note) lines.push(result.note, '');

    const shown = result.failures.slice(0, MAX_FAILURES_LISTED);
    for (const failure of shown) {
        lines.push(`- \`${failure.file}\` -- ${failure.title}`);
        if (withMessages && failure.message) {
            const message = formatMessage(failure.message);
            lines.push('', '  ```', ...message.split('\n').map((line) => `  ${line}`), '  ```', '');
        }
    }

    const hidden = result.failures.length - shown.length;
    if (hidden > 0) lines.push(`_...and ${hidden} more, see the run logs._`, '');

    // Trailing blanks would double up against the separator build() adds.
    while (lines.at(-1) === '') {
        lines.pop();
    }

    lines.push('', '</details>');
    return lines.join('\n');
}

function footer() {
    const {
        GITHUB_SERVER_URL = 'https://github.com',
        GITHUB_REPOSITORY,
        GITHUB_RUN_ID,
        GITHUB_RUN_NUMBER,
        COMMIT_SHORT_SHA,
    } = process.env;

    const parts = [];
    if (COMMIT_SHORT_SHA) parts.push(`commit \`${COMMIT_SHORT_SHA}\``);
    if (GITHUB_REPOSITORY && GITHUB_RUN_ID) {
        const url = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
        const label = GITHUB_RUN_NUMBER ? `run #${GITHUB_RUN_NUMBER}` : 'run';
        parts.push(`[${label}](${url})`);
    }

    return parts.length ? [`_Last updated for ${parts.join(', ')}._`] : [];
}

function build(results, { withMessages = true } = {}) {
    const lines = ['### Asset compatibility', ''];

    if (!results.length) {
        lines.push(
            'The asset-compatibility job produced no results, most likely because it was',
            'cancelled before it could upload any. Nothing is known about this commit.',
            '',
            ...footer()
        );
        return lines.join('\n');
    }

    lines.push(
        'The asset bundles were rebuilt from this PR\'s packages and run through the e2e',
        'suite, once against Teraslice built from this PR and once against a published',
        'Teraslice release. A failure here means an asset repo would break against these',
        'packages; it does not mean this PR\'s own tests failed, and it does not block',
        'merging.',
        '',
        '| Teraslice under test | Result | Failing specs |',
        '| :--- | :--- | :--- |'
    );

    for (const result of results) {
        const { teraslice } = entryInfo(result.command);
        lines.push(
            `| ${teraslice} (\`${result.command}\`) | ${resultCell(result)} | ${failingFiles(result)} |`
        );
    }

    const notClean = results.filter((result) => result.status !== 'clean');
    if (notClean.length) {
        lines.push('');
        for (const result of notClean) lines.push(detailsFor(result, { withMessages }), '');
    } else {
        lines.push('', 'Every entry passed.', '');
    }

    lines.push(...footer());
    return lines.join('\n');
}

/**
 * Failure messages are jest stack traces and can be enormous, so they are the first
 * thing dropped when the body would not fit. The table always survives.
 */
function buildWithinLimit(results) {
    const full = build(results);
    if (full.length <= MAX_BODY_CHARS) return full;

    const trimmed = build(results, { withMessages: false });
    if (trimmed.length <= MAX_BODY_CHARS) {
        return `${trimmed}\n\n_Failure output was omitted to fit the comment size limit; see the run logs._`;
    }

    return `${trimmed.slice(0, MAX_BODY_CHARS)}\n\n_Truncated to fit the comment size limit; see the run logs._`;
}

function main() {
    const dir = process.argv[2];
    if (!dir) {
        process.stderr.write('usage: build-asset-compat-comment.js <results-dir>\n');
        process.exit(2);
    }

    const results = readResults(dir).map((result) => ({ ...result, ...classify(result) }));
    process.stdout.write(`${buildWithinLimit(results)}\n`);

    // No results at all is a finding in its own right, not a clean run.
    const hasFindings = !results.length || results.some((result) => result.status !== 'clean');
    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `has-findings=${hasFindings}\n`);
    }
}

main();
