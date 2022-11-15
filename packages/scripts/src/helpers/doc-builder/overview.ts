import path from 'path';
import fse from 'fs-extra';
import { PackageInfo } from '../interfaces.js';
import { writeIfChanged, getRootInfo } from '../misc.js';
import { getDocPath } from '../packages.js';

export async function generateReadme(pkgInfo: PackageInfo): Promise<string> {
    const rootInfo = getRootInfo();

    const docsPath = getDocPath(pkgInfo, true, false);
    let issuesUrl: string;
    const encodedLabel = pkgInfo.folderName === 'e2e' ? `${pkgInfo.folderName}` : `pkg%2F${pkgInfo.folderName}`;
    const isGithub = rootInfo.bugs.url.includes('github');
    if (isGithub) {
        issuesUrl = `${rootInfo.bugs.url}?q=is%3Aopen+is%3Aissue+label%3A${encodedLabel}`;
    } else {
        // work with gitlab too
        issuesUrl = `${rootInfo.bugs.url}?state=opened&label_name[]=${encodedLabel}`;
    }

    return `<!-- THIS FILE IS AUTO-GENERATED, EDIT ${docsPath}.md -->

# ${pkgInfo.displayName}

> ${pkgInfo.description}

This a package within the [${rootInfo.displayName}](${rootInfo.homepage}) monorepo. See our [documentation](${
    rootInfo.documentation
}/${isGithub ? docsPath : `${docsPath}.md`}) for more information or the [issues](${issuesUrl}) associated with this package

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[${pkgInfo.license}](./LICENSE) licensed.`;
}

export async function updateReadme(pkgInfo: PackageInfo, log?: boolean): Promise<void> {
    const readmePath = path.join(pkgInfo.dir, 'README.md');
    const contents = await generateReadme(pkgInfo);
    await writeIfChanged(readmePath, contents, { log });
}

export async function generateOverview(pkgInfo: PackageInfo) {
    const sideBarLabel = isE2E(pkgInfo) ? pkgInfo.displayName : 'overview';
    return `---
title: ${pkgInfo.displayName}
sidebar_label: ${sideBarLabel}
---

> ${pkgInfo.description}`;
}

export async function ensureOverview(pkgInfo: PackageInfo, log?: boolean): Promise<void> {
    const pkgDocPath = getDocPath(pkgInfo, true, true);
    if (!fse.existsSync(pkgDocPath)) {
        const contents = await generateOverview(pkgInfo);
        await writeIfChanged(pkgDocPath, contents, {
            mkdir: true,
            log,
        });
    }
}

function isE2E(pkgInfo: PackageInfo) {
    return pkgInfo.folderName === 'e2e';
}
