'use strict';

const shorthand = require('../cmds/lib/shorthand')();

describe('shorthand valid() testing', () => {
    it('should return true given a valid shorthand string', async () => {
        const result = await shorthand.valid('test1:job:99999999-9999-9999-9999-999999999999');
        expect(result)
            .toBe(true);
    });
    it('should return false given an invalid shorthand string', async () => {
        const result = await shorthand.valid('test1;job;99999999-9999-9999-9999-999999999999');
        expect(result)
            .toBe(false);
    });
});
describe('shorthand parse() testing', () => {
    const testString1 = 'test1:job:99999999-9999-9999-9999-999999999999';
    const testString2 = 'test2:job:test2.json';
    const testString3 = 'test3:ex:99999999-9999-9999-9999-999999999999';
    const testString4 = 'test3,ex,99999999-9999-9999-9999-999999999999';
    const testString5 = 'test3:joobs:99999999-9999-9999-9999-999999999999';

    it('should parse out elements of valid shorthand string (job/id)', async () => {
        const result = await shorthand.parse(testString1);
        expect(result.cluster).toBe('test1');
        expect(result.id).toBe('99999999-9999-9999-9999-999999999999');
        expect(result.string).toBe(testString1);
        expect(result.type).toBe('job');
    });

    it('should parse out elements of valid shorthand string (job/file)', async () => {
        const result = await shorthand.parse(testString2);
        expect(result.string).toBe(testString2);
        expect(result.cluster).toBe('test2');
        expect(result.file).toBe('test2.json');
        expect(result.type).toBe('job');
        expect(result.id).toBe(undefined);
    });

    it('should parse out elements of valid shorthand string (ex/id)', async () => {
        const result = await shorthand.parse(testString3);
        expect(result.cluster).toBe('test3');
        expect(result.id).toBe('99999999-9999-9999-9999-999999999999');
        expect(result.string).toBe(testString3);
        expect(result.type).toBe('ex');
    });

    it('should return a value with no colons as the cluster', async () => {
        const result = await shorthand.parse(testString4);
        expect(result.cluster).toBe(testString4);
        expect(result.string).toBe(testString4);
    });

    it('should assign file value to shorthand string containing .json', async () => {
        const testJobFile = 'test-job.json';
        const result = await shorthand.parse(testJobFile);
        expect(result.file).toBe(testJobFile);
        expect(result.string).toBe(testJobFile);
    });
    it('should not assign file value to shorthand string containing .txt', async () => {
        const testJobFile = 'test-job.txt';
        const result = await shorthand.parse(testJobFile);
        expect(result.file).toBe(undefined);
        expect(result.string).toBe(testJobFile);
    });
    it('should fail for non-valid type', async () => {
        const result = await shorthand.parse(testString5);
        expect(result.file).toBe(undefined);
        expect(result.string).toBe(testString5);
    });


    it('should return a value with no colons as the cluster', async () => {
        const clusterValue = 'cluster-test1';
        const result = await shorthand.parse(clusterValue);
        expect(result.cluster).toBe(clusterValue);
        expect(result.string).toBe(clusterValue);
    });
});

describe('shorthand idCheck() testing', () => {
    it('should return true given matching id in response.job_id', async () => {
        const specId = '99999999-9999-9999-9999-999999999999';
        const responseId = {};
        responseId.job_id = specId;
        const result = await shorthand.idCheck(specId, responseId);
        expect(result).toBe(true);
    });
    it('should return true given matching id in response.ex_id', async () => {
        const specId = '99999999-9999-9999-9999-999999999999';
        const responseId = {};
        responseId.ex_id = specId;
        const result = await shorthand.idCheck(specId, responseId);
        expect(result).toBe(true);
    });
    it('should return false given non-matching id in response.job_id', async () => {
        const specId = '99999999-9999-9999-9999-999999999999';
        const responseId = {};
        responseId.job_id = '99999999-9999-9999-9999-999999999998';
        const result = await shorthand.idCheck(specId, responseId);
        expect(result).toBe(false);
    });
    it('should return false given non-matching id in response.ex_id', async () => {
        const specId = '99999999-9999-9999-9999-999999999999';
        const responseId = {};
        responseId.ex_id = '99999999-9999-9999-9999-999999999998';
        const result = await shorthand.idCheck(specId, responseId);
        expect(result).toBe(false);
    });
});
