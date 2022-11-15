'use strict';

const config = require('../jest.config.base')(__dirname);

config.collectCoverage = false;
delete config.transform;
module.exports = config;


import { fileURLToPath } from 'url';
import base from '../../jest.config.base.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

const config =  base(dirPath);

config.collectCoverage = false;
delete config.transform;

export default config;
