'use strict';

const moment = require('moment');
const dateMath = require('datemath-parser');

const dateFormat = require('../../../utils/date_utils').dateFormat;

module.exports = function (logger, req, startingQuery) {
    let query = startingQuery || '';
    const body = { query: { bool: { must: [] } } };
    const queryLogic = body.query.bool.must;
    const start = req.query.start;
    const end = req.query.end;
    const size = req.query.size || 10000;
    const sort = req.query.sort || '_updated:asc';
    const dateField = req.query.date_field || '_updated';

    if (req.query.status) query = `${query} _status:(${req.query.status.split(',').map(status => status.trim()).join(' OR ')})`;

    if (query.length > 0) {
        queryLogic.push({
            query_string: {
                default_field: '',
                query
            }
        });
    }

    if (start || end) {
        const rangeQuery = prepareDateRange(parseDate(start), parseDate(end));
        if (rangeQuery) queryLogic.push(rangeQuery)
    }


    function parseDate(date) {
        try {
            return moment(dateMath.parse(date)).format(dateFormat);
        } catch (err) {
            return null;
        }
    }

    function prepareDateRange(startTime, endTime) {
        const rangeQuery = {
            range: {}
        };

        rangeQuery.range[dateField] = {};

        if (startTime && endTime) {
            rangeQuery.range[dateField].gte = startTime;
            rangeQuery.range[dateField].lte = endTime;
            return rangeQuery;
        }
        if (startTime) {
            rangeQuery.range[dateField].gte = startTime;
            return rangeQuery;
        }
        if (endTime) {
            rangeQuery.range[dateField].lte = endTime;
            return rangeQuery;
        }

        return null;
    }


    /* function performSearch(context, req, res, config) {
        if (req.query.size) {
            var size = req.query.size;
            if (typeof size === "object") {
                res.status(500).json({error: "size parameter must be a number, was given " + JSON.stringify(size)});
                return;
            }

            if (isNaN(Number.parseInt(size))) {
                res.status(500).json({error: "size parameter must be a valid number, was given " + size});
                return;
            }
        }


        var max_query_size = config.max_query_size;
        if (! max_query_size) max_query_size = 100000;

        if (req.query.size && req.query.size > max_query_size) {
            res.status(500).json({error: "Request size too large. Must be less than " + max_query_size + "."});
            return;
        }

        context.body = {
            'query': {
                'bool': {
                    'must': []
                }
            }
        };

        var bool_clause = context.body.query.bool.must;

        // Setup the default query context
        if (config.query) {
            bool_clause.push(config.query);
        }

        if (config.date_range) {
            if (!validateDateRange(res, req.query.date_start, req.query.date_end)) {
                return;
            }
            var dateContext = prepareDateRange(req.query.date_start, req.query.date_end);
            if (dateContext) {
                bool_clause.push(dateContext);
            }
        }

        // Geospatial support
        if (config.geo_field) {
            var geo_search = geoSearch(req, res, config.geo_field);
            if (geo_search) {
                bool_clause.push(geo_search);
            }
            else {
                return;
            }
        }

        context.size = 100;
        if (req.query.size) {
            context.size = req.query.size;
        }

        if (req.query.start) {
            if (isNaN(req.query.start)) {
                res.status(500).json({error: "the start parameter must be a number, was given: " + req.query.start});
                return;
            }
            else {
                context.from = req.query.start;
            }
        }

        // Parameter to retrieve a particular type of record
        if (req.query.type) {
            if (!validate(res, req.query.type, "string", "type")) return;
            else {
                bool_clause.push({
                    'term': {
                        'type': req.query.type
                    }
                });
            }

        }

        // See if we should include a default sort
        if (config.sort_default) {
            context.sort = config.sort_default;
        }

        if (config.sort_enabled && req.query.sort) {
            // split the value and verify
            if (!validate(res, req.query.sort, "string", "sort")) return;

            var pieces = req.query.sort.split(':');
            if (config.sort_dates_only && pieces[0].toLowerCase() !== date_field) {
                res.status(500).json({error: "Invalid sort parameter. Sorting currently available for the '" + date_field + "' field only."});
                return;
            }

            if (pieces.length != 2 || (pieces[1].toLowerCase() != 'asc' && pieces[1].toLowerCase() != 'desc')) {
                res.status(500).json({error: "Invalid sort parameter. Must be field_name:asc or field_name:desc."});
                return;
            }

            context.sort = req.query.sort;
        }
        var client = config.es_client;

        if (req.query.fields || config.allowed_fields) {

            if (req.query.fields && !validate(res, req.query.fields, "string", "fields")) return;
            var finalFields;

            if (config.allowed_fields) {
                finalFields = config.allowed_fields;
            }

            if (req.query.fields) {
                var fields = req.query.fields.split(',');
                finalFields = _.filter(fields, function(field) {
                    if (config.allowed_fields) {
                        if (config.allowed_fields.indexOf(field.trim()) !== -1) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                    else {
                        return true;
                    }
                });

                if (finalFields.length === 0) {
                    res.status(500).json({error: 'the fields parameter does not contain any valid fields'});
                    return;
                }

            }

            context._sourceInclude = finalFields;
        }

        client.search(context, function(error, response) {
            if (error || (response && response.error)) {
                if (error) {
                    logger.error("Search error " + error);
                }
                else {
                    logger.error("Search response error " + response.error);
                }

                res.status(500).json({error: 'Error during query execution.'});
                return;
            }

            if (response.hits) {
                var results = [];
                for (var i = 0; i < response.hits.hits.length; i++) {
                    results.push(response.hits.hits[i]._source);
                }

                var message = response.hits.total + " results found.";
                if (response.hits.total > context.size) {
                    message += " Returning " + context.size + "."
                }

                if (!config.sort_enabled && req.query.sort) {
                    message += " No sorting available."
                }

                if (config.post_process && typeof config.post_process === 'function') {
                    results = config.post_process(results)
                }

                var final_response = {
                    info: message,
                    total: response.hits.total,
                    returning: +context.size,
                    results: results
                };

                if (req.query.pretty) {
                    res
                        .set("Content-type", "application/json; charset=utf-8")
                        .send(JSON.stringify(final_response, null, 2));
                }
                else {
                    res.json(final_response);
                }
            }
            else {
                res.status(500).json({error: 'No results returned from query.'});
            }
        });
    } */


    function properQuery(lucQuery, re) {
        const parts = lucQuery.split(' ');
        return _.every(parts, (str) => {
            if (str.match(re)) {
                // checks for a colon, in-between zero and multiple characters and one or more colons
                if (str.match(/\:(?=.{0,40}\:+)/gi)) {
                    return true;
                }
                return false;
            }

            // not a potential problem, so return true
            return true;
        });
    }

    function luceneQuery(req, res, index, config) {
        if (!req.query || !req.query.q) {
            if (config.require_query !== false) {
                res.status(500).json({ error: 'Search query must be specified in the query parameter q.' });
                return;
            }
        }

        if (config.require_query === true && req.query.q) {
            if (!validate(res, req.query.q, 'string', 'query')) return;
        }
        // if require query is false, need to set to empty string to not break code
        const lucQuery = req.query.q ? req.query.q : '';

        // Verify the query string doesn't contain any forms that we need to block
        const re = RegExp('[^\\s]*.*:[\\s]*[\\*\\?](.*)');
        if (re.test(lucQuery)) {
            if (!properQuery(lucQuery, re)) {
                res.status(500).json({ error: "Wild card queries of the form 'fieldname:*value' or 'fieldname:?value' can not be evaluated. Please refer to the documentation on 'fieldname.right'." });
                return;
            }
        }

        if (config.allowed_fields) {
            const queryFields = luceneParser(lucQuery);
            const failures = [];

            for (const key in queryFields) {
                if (config.allowed_fields.indexOf(key) === -1) {
                    failures.push(key);
                }
            }

            if (failures.length >= 1) {
                res.status(400).json({ error: `you cannot query on these terms: ${failures.join('')}` });
                return;
            }
        }

        if (lucQuery && lucQuery.length > 0) {
            config.query = {
                query_string: {
                    default_field: '',
                    query: lucQuery
                }
            };
        }

        //   performSearch({index: index, ignoreUnavailable: true}, req, res, config);
    }

    function luceneParser(str) {
        const words = str.split(' ');

        return words.reduce((prev, val) => {
            const test = val.match(/:/);
            if (test) {
                prev[val.slice(0, test.index)] = true;
            }

            return prev;
        }, {});
    }

    return body;
};
