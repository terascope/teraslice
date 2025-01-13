import path from 'node:path';
import semver from 'semver';
import fse from 'fs-extra';
import { getRootInfo } from '@terascope/scripts';

describe('Ensure teraslice and root versions are in sync', () => {
    it('Versions are equal', () => {
        const pathToTeraslicePkgJson = path.join(process.cwd(), '../packages/teraslice/package.json');
        const terasliceVersion = fse.readJSONSync(pathToTeraslicePkgJson).version;
        const rootVersion = getRootInfo().version;

        expect(semver.eq(terasliceVersion, rootVersion)).toBe(true);
    });
});
