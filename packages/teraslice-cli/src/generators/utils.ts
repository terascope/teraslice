import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export function getTemplatePath(name: string): string {
    const folderName = path.join('generator-templates', name);
    let templatePath = path.join(dirname, '../..', folderName);
    if (fs.existsSync(templatePath)) {
        return templatePath;
    }

    templatePath = path.join(dirname, '../../..', folderName);
    if (fs.existsSync(templatePath)) {
        return templatePath;
    }

    throw new Error('Unable to find generator template paths');
}
