import type {
    OptionsOfTextResponseBody as Options, Response, Request,
    AbortError, CacheError, CancelError, HTTPError, MaxRedirectsError,
    ParseError, ReadError, RequestError, RetryError, TimeoutError, UploadError
} from 'got';

type HttpClientErrors = {
    AbortError: AbortError;
    CacheError: CacheError;
    CancelError: CancelError;
    HTTPError: HTTPError;
    MaxRedirectsError: MaxRedirectsError;
    ParseError: ParseError;
    ReadError: ReadError;
    RequestError: RequestError;
    RetryError: RetryError;
    TimeoutError: TimeoutError;
    UploadError: UploadError;
};

export type {
    Options,
    HttpClientErrors,
    Response,
    Request
};
