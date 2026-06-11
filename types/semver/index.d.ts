import type { SemVer, Options, ReleaseType } from 'semver';

// truncate exists in semver@7.8.2 but is missing from @types/semver@7.7.1
// remove this file when @types/semver is updated
export function truncate(
    version: string | SemVer,
    truncation: Exclude<ReleaseType, 'release'>,
    options?: Options
): string | null;
