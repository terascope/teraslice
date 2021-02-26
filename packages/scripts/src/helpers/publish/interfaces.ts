export enum PublishType {
    Latest = 'latest',
    Prerelease = 'prerelease',
    Daily = 'daily',
    Dev = 'dev',
    Tag = 'tag'
}

export enum PublishAction {
    Docker = 'docker',
    NPM = 'npm',
}

export interface PublishOptions {
    type: PublishType;
    dryRun: boolean;
}
