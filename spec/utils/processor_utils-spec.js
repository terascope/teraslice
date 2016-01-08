'use strict';

var utils = require('../../lib/utils/processor_utils');

describe('processor_utils', function(){
    var record = {'someDate': '2015/08/31'};

    it('can format date to conventions used', function(){
        var formattedDate = utils.formattedDate;
        var opConfig = {date_field: 'someDate'};

        var formatted = formattedDate(record, opConfig);

        expect(formatted).toEqual('2015.08.31')

    });

    it('can format date by timeseries conventions, defaults to daily', function(){
        var formattedDate = utils.formattedDate;
        var opConfigDefault = {date_field: 'someDate'};
        var opConfigDaily = {date_field: 'someDate', timeseries: 'daily'};
        var opConfigMonthly = {date_field: 'someDate', timeseries: 'monthly'};
        var opConfigYearly = {date_field: 'someDate', timeseries: 'yearly'};

        var defaults = formattedDate(record, opConfigDefault);
        var daily = formattedDate(record, opConfigDaily);
        var monthly = formattedDate(record, opConfigMonthly);
        var yearly = formattedDate(record, opConfigYearly);

        expect(defaults).toEqual('2015.08.31');
        expect(daily).toEqual('2015.08.31');
        expect(monthly).toEqual('2015.08');
        expect(yearly).toEqual('2015');

    });

    it('indexName will create a timeseries if specified in opConfig', function() {
        var record = {'@timestamp': new Date('2016/08/28')};
        var opConfig = {index: 'events-2016.08.28'};
        var opConfigDaily = {index_prefix: 'events-', date_field: '@timestamp', timeseries: 'daily'};
        var opConfigMonthly = {index_prefix: 'events-', date_field: '@timestamp', timeseries: 'monthly'};
        var opConfigYearly = {index_prefix: 'events-', date_field: '@timestamp', timeseries: 'yearly'};


        var indexName = utils.indexName(record, opConfig);
        var Daily = utils.indexName(record, opConfigDaily);
        var Monthly = utils.indexName(record, opConfigMonthly);
        var Yearly = utils.indexName(record, opConfigYearly);


        expect(typeof utils.indexName).toEqual('function');
        expect(indexName).toEqual('events-2016.08.28');
        expect(Daily).toEqual('events-2016.08.28');
        expect(Monthly).toEqual('events-2016.08');
        expect(Yearly).toEqual('events-2016');

    });

    it('getFilename is a function and returns a string', function(){
        var getFileName = utils.getFileName;
        var opConfig = {directory: 'some/path'};
        var config = {_nodeName: 'someNodeName'};

        var results = getFileName(false, opConfig, config);

        expect(typeof getFileName).toEqual('function');
        expect(results).toEqual('some/path/someNodeName');

    });

    it('getFileName gets different files under different configurations', function(){

        var getFileName = utils.getFileName;
        var opConfig1 = {directory: 'some/path'};
        var opConfig2 = {directory: 'some/path', filename: 'someName.txt'};
        var config = {_nodeName: 'someNodeName'};

        var results1 = getFileName('2015.08.31', opConfig1, config);
        var results2 = getFileName('2015.08.31', opConfig2, config);

        expect(results1).toEqual('some/path-2015.08.31/someNodeName');
        expect(results2).toEqual('some/path-2015.08.31/someName.txt');

    });

});