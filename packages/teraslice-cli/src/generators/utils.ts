import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dirPath = fileURLToPath(new URL('.', import.meta.url));


export function getTemplatePath(name: string): string {
    const folderName = path.join('generator-templates', name);
    let templatePath = path.join(dirPath, '../..', folderName);
    if (fs.existsSync(templatePath)) {
        return templatePath;
    }

    templatePath = path.join(dirPath, '../../..', folderName);
    if (fs.existsSync(templatePath)) {
        return templatePath;
    }

    throw new Error('Unable to find generator template paths');
}
