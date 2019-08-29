import path from 'path';
import { getChangedFiles } from '../scripts';
import { PackageInfo } from '../interfaces';
import { SyncOptions } from './interfaces';
import { formatList } from '../misc';
import signale from '../signale';

export async function verify(files: string[], options: SyncOptions) {
    if (!options.verify) return;

    const changed = await getChangedFiles(...files);
    if (changed.length) {
        signale.error(
            `Files have either changes or are out-of-sync, run 'yarn sync' and push up the changes:${formatList(changed)}`
        );
        process.exit(1);
    }
}

export function getFiles(pkgInfo?: PackageInfo): string[] {
    if (pkgInfo) {
        return [
            path.join('packages', pkgInfo.folderName),
            path.join('docs/packages', pkgInfo.folderName)
        ];
    }
    return ['packages', 'docs', 'website'];
}
