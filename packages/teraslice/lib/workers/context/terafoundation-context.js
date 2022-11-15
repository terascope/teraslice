import { ProcessContext } from 'terafoundation';
import { getTerasliceConfig } from '../../config.js';

export default function makeTerafoundationContext({ sysconfig } = {}) {
    return new ProcessContext(getTerasliceConfig(), sysconfig ? {
        configfile: sysconfig
    } : undefined);
};
