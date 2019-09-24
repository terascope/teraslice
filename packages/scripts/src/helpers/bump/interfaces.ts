import { ReleaseType } from 'semver';
import { PackageInfo } from '../interfaces';

export type BumpPackageOptions = {
    release: ReleaseType;
    packages: PackageInfo[];
    deps: boolean;
    preId?: string;
};
