'use strict';

function JobStateError(message) {
    this.message = message;
    this.name = "JobStateError";
    Error.captureStackTrace(this, JobStateError);
}
JobStateError.prototype = Object.create(Error.prototype);
JobStateError.prototype.constructor = JobStateError;

module.exports = {
    JobStateError: JobStateError
}