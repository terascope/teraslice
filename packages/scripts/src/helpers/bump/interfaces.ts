import { ReleaseType } from 'semver';
import { PackageInfo } from '../interfaces';

export type BumpPackageOptions = {
    release: ReleaseType;
    packages: PackageInfo[];
    deps: boolean;
    preId?: string;
};

export type BumpPkgInfo = {
    from: string;
    to: string;
    main: boolean;
    deps: {
        name: string;
        type: BumpType;
    }[];
}

export enum BumpType {
    Dev = 'dev',
    Prod = 'prod',
    Peer = 'peer',
}
