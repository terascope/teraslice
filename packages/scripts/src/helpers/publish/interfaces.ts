export enum PublishType {
    Latest = 'latest',
    Prelease = 'prerelease',
    Daily = 'daily',
    Dev = 'dev',
    Tag = 'tag'
}

export enum PublishAction {
    Docker = 'docker',
    NPM = 'npm',
}

export type PublishOptions = {
    type: PublishType;
    dryRun: boolean;
};
