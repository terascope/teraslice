'use strict';

const GeneratorUtil = require('../../lib/generator-util');

describe('generator util', () => {
    const genUtil = new GeneratorUtil();
    it('should capitolize the first letter', () => {
        expect(genUtil.capitolizeFirstLetter('bob')).toBe('Bob');
        expect(genUtil.capitolizeFirstLetter('BOB')).toBe('BOB');
        expect(genUtil.capitolizeFirstLetter('1234')).toBe('1234');
    });

    it('should return variable object needed for a batch processor', () => {
        const variables = genUtil.processorTemplateVariables('Batch');
        expect(variables.typeFunc).toBe('onBatch');
        expect(variables.dataType).toBe('dataArray');
        expect(variables.sampleCode.includes('return dataArray')).toBe(true);
        expect(variables.testResult).toBe('results.forEach(doc => expect(doc.date).toBeDefined());');
        expect(variables.testDescription).toBe('add dates to records if the date is missing');
    });

    it('should return variable object needed for filter processor', () => {
        const variables = genUtil.processorTemplateVariables('Filter');
        expect(variables.typeFunc).toBe('filter');
        expect(variables.dataType).toBe('doc');
        expect(variables.sampleCode.includes('return true')).toBe(true);
        expect(variables.testResult).toBe('expect(results.length).toBe(1);');
        expect(variables.testDescription).toBe('return records that have a date');
    });

    it('should return variable object needed for map processor', () => {
        const variables = genUtil.processorTemplateVariables('Map');
        expect(variables.typeFunc).toBe('map');
        expect(variables.dataType).toBe('doc');
        expect(variables.sampleCode.includes('return doc')).toBe(true);
        expect(variables.testResult).toBe('results.forEach(doc => expect(doc.date).toBeDefined());');
        expect(variables.testDescription).toBe('add dates to records if the date is missing');
    });
});
