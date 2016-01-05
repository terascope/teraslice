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

});