import { PackageInfo } from '../interfaces';
import { listPackages } from '../packages';
import { PublishType, PublishOptions } from './interfaces';
import { yarnPublish, yarnRun } from '../scripts';
import { shouldNPMPublish } from './utils';
import signale from '../signale';

export async function publish(options: PublishOptions) {
    signale.debug(`publishing to ${options.type}`);
    for (const pkgInfo of listPackages()) {
        if (options.type === PublishType.NPM) {
            await npmPublish(pkgInfo, options);
        }
    }
}

async function npmPublish(pkgInfo: PackageInfo, options: PublishOptions) {
    const shouldPublish = await shouldNPMPublish(pkgInfo, options.tag);
    if (!shouldPublish) return;

    if (options.dryRun) {
        await yarnRun('prepublishOnly', [], pkgInfo.dir);
    } else {
        await yarnPublish(pkgInfo);
    }
}
