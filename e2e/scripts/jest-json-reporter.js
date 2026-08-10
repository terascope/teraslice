/**
 * Writes jest's `--json` report to the file named by `JEST_JSON_REPORT`.
 *
 * Used by the `e2e-assets-from-source-tests` job in .github/workflows/test.yml,
 * whose only output is a PR comment built from this file -- see
 * e2e/scripts/build-asset-compat-comment.js.
 *
 * **Why not `--json --outputFile`.** Both are written by the same `if (isJSON)`
 * branch of `processResults` in @jest/core, which runs after
 * `scheduler.scheduleTests()` returns. The e2e suite always runs with `--bail`
 * (forced in packages/scripts/src/helpers/test-runner/utils.ts), and jest's bail
 * path calls `exit()` from inside `TestScheduler._bailIfNeeded`, so
 * `processResults` is never reached. A failing e2e run therefore leaves no report
 * at all: the failure it stopped for is the one thing that never gets out, and the
 * run is indistinguishable from one that died in `global.setup`.
 *
 * `onRunComplete` is dispatched to every reporter *before* that exit, so a reporter
 * sees results `--outputFile` never does. What it cannot see is the suites bail
 * skipped: `testResults` holds what ran and `numTotalTestSuites` what was selected,
 * and the difference is what is missing from the report. The comment builder says
 * so rather than presenting a bailed run as the whole picture.
 *
 * With `JEST_JSON_REPORT` unset this does nothing, so it is safe to leave in a
 * `--reporters` list. A failed write is deliberately not caught: jest reports the
 * reporter error, which is louder than a silently missing report.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Mirrors `formatTestResult` in @jest/test-result, which is what turns jest's
 * internal results into the `--json` shape.
 * Anything reading the output can treat it as a jest report.
 *
 * https://github.com/jestjs/jest/blob/main/packages/jest-test-result/src/formatTestResults.ts
 */
function formatTestResult(result) {
    if (result.testExecError) {
        const now = Date.now();
        return {
            assertionResults: result.testResults,
            endTime: now,
            message: result.failureMessage ?? result.testExecError.message,
            name: result.testFilePath,
            startTime: now,
            status: 'failed',
            summary: '',
        };
    }

    if (result.skipped) {
        const now = Date.now();
        return {
            assertionResults: result.testResults,
            endTime: now,
            message: result.failureMessage ?? '',
            name: result.testFilePath,
            startTime: now,
            status: 'skipped',
            summary: '',
        };
    }

    const allTestsExecuted = result.numPendingTests === 0;
    const allTestsPassed = result.numFailingTests === 0;

    return {
        assertionResults: result.testResults,
        endTime: result.perfStats?.end,
        message: result.failureMessage ?? '',
        name: result.testFilePath,
        startTime: result.perfStats?.start,
        status: allTestsPassed ? (allTestsExecuted ? 'passed' : 'focused') : 'failed',
        summary: '',
    };
}

/**
 * Mirrors `serializeToJSON` in @jest/core: `openHandles` holds Errors, which
 * `JSON.stringify` turns into `{}`. Duck-typed rather than `instanceof`, since an
 * Error thrown inside a test's module registry is not the same class as ours.
 *
 * https://github.com/jestjs/jest/blob/main/packages/jest-core/src/lib/serializeToJSON.ts
 */
function replacer(_key, value) {
    const isError = value instanceof Error
        || (value != null
            && typeof value === 'object'
            && typeof value.message === 'string'
            && typeof value.stack === 'string');

    if (isError) {
        return { message: value.message, name: value.name, stack: value.stack };
    }

    return value;
}

export default class JestJSONReporter {
    constructor() {
        this.outputFile = process.env.JEST_JSON_REPORT;
    }

    onRunComplete(_testContexts, results) {
        if (!this.outputFile) return;

        const report = {
            ...results,
            testResults: results.testResults.map(formatTestResult),
        };

        fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
        fs.writeFileSync(this.outputFile, `${JSON.stringify(report, replacer, 2)}\n`);
    }
}
