'use strict';

describe('-> aliases cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/aliases/list')).toBeDefined();
        expect(require('../../cmds/aliases/add')).toBeDefined();
        expect(require('../../cmds/aliases/add')).toBeDefined();
        expect(require('../../cmds/aliases/remove')).toBeDefined();
        expect(require('../../cmds/aliases/update')).toBeDefined();
        expect(require('../../cmds/aliases/index')).toBeDefined();
    });
});

describe('-> assets cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/assets/deploy')).toBeDefined();
        expect(require('../../cmds/assets/index')).toBeDefined();
        expect(require('../../cmds/assets/init')).toBeDefined();
        expect(require('../../cmds/assets/list')).toBeDefined();
        expect(require('../../cmds/assets/load')).toBeDefined();
        expect(require('../../cmds/assets/replace')).toBeDefined();
        expect(require('../../cmds/assets/status')).toBeDefined();
    });
});

describe('-> controller cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/controllers/index')).toBeDefined();
        expect(require('../../cmds/controllers/list')).toBeDefined();
        expect(require('../../cmds/controllers/stats')).toBeDefined();
    });
});

describe('-> ex cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/ex/errors')).toBeDefined();
        expect(require('../../cmds/ex/index')).toBeDefined();
        expect(require('../../cmds/ex/list')).toBeDefined();
        expect(require('../../cmds/ex/status')).toBeDefined();
        expect(require('../../cmds/ex/stop')).toBeDefined();
    });
});

describe('-> job cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/jobs/errors')).toBeDefined();
        expect(require('../../cmds/jobs/index')).toBeDefined();
        expect(require('../../cmds/jobs/list')).toBeDefined();
        expect(require('../../cmds/jobs/pause')).toBeDefined();
        expect(require('../../cmds/jobs/recover')).toBeDefined();
        expect(require('../../cmds/jobs/restart')).toBeDefined();
        expect(require('../../cmds/jobs/resume')).toBeDefined();
        expect(require('../../cmds/jobs/run')).toBeDefined();
        expect(require('../../cmds/jobs/save')).toBeDefined();
        expect(require('../../cmds/jobs/start')).toBeDefined();
        expect(require('../../cmds/jobs/status')).toBeDefined();
        expect(require('../../cmds/jobs/stop')).toBeDefined();
        expect(require('../../cmds/jobs/view')).toBeDefined();
        expect(require('../../cmds/jobs/workers')).toBeDefined();
    });
});

describe('-> nodes cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/nodes/index')).toBeDefined();
        expect(require('../../cmds/nodes/list')).toBeDefined();
    });
});

describe('-> tjm cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/tjm/errors')).toBeDefined();
        expect(require('../../cmds/tjm/index')).toBeDefined();
        expect(require('../../cmds/tjm/init')).toBeDefined();
        expect(require('../../cmds/tjm/register')).toBeDefined();
        expect(require('../../cmds/tjm/reset')).toBeDefined();
        expect(require('../../cmds/tjm/run')).toBeDefined();
        expect(require('../../cmds/tjm/start')).toBeDefined();
        expect(require('../../cmds/tjm/stop')).toBeDefined();
        expect(require('../../cmds/tjm/update')).toBeDefined();
        expect(require('../../cmds/tjm/view')).toBeDefined();
    });
});

describe('-> workers cmds', () => {
    test('should not error on require', () => {
        expect(require('../../cmds/workers/index')).toBeDefined();
        expect(require('../../cmds/workers/list')).toBeDefined();
    });
});
