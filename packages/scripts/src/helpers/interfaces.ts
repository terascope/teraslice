export type PackageInfo = {
    dir: string;
    folderName: string;
    name: string;
    displayName: string;
    version: string;
    description: string;
    license: string;
    terascope: PackageConfig;
    dependencies: {
        [pkg: string]: string;
    };
    devDependencies: {
        [pkg: string]: string;
    };
    peerDependencies: {
        [pkg: string]: string;
    };
};

export type PackageConfig = {
    enableTypedoc?: boolean;
};

export const AvailablePackageConfigKeys: ReadonlyArray<keyof PackageConfig> = ['enableTypedoc'];

export type TSCommands = 'docs';
