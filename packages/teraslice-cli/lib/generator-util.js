#!/usr/bin/env node

'use strict';

class GeneratorUtil {
    // not sure this really belongs here, but doesn't seem to fit anywhere else well either
    capitolizeFirstLetter(value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    processorTemplateVariables(type) {
        let typeFunc = 'onBatch';
        let dataType = 'dataArray';
        let sampleCode = `
        return dataArray.map((doc) => {
            if (!doc.date) {
                doc.date = new Date();
            }
            return doc;
        });`;

        let testDescription = 'add dates to records if the date is missing';
        let testResult = 'results.forEach(doc => expect(doc.date).toBeDefined());';

        if (type !== 'Batch') {
            typeFunc = type.toLowerCase();
            dataType = 'doc';
        }

        if (type === 'Map') {
            sampleCode = `
            if (!doc.date) {
                doc.date = new Date();
            }
            return doc;`;
        }

        if (type === 'Filter') {
            sampleCode = `
            if (!doc.date) {
                return false;
            }
            return true;`;
            testDescription = 'return records that have a date';
            testResult = 'expect(results.length).toBe(1);';
        }

        return {
            typeFunc,
            dataType,
            sampleCode,
            testResult,
            testDescription
        };
    }
}

module.exports = GeneratorUtil;
