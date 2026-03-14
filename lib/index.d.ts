import { RequestInit, HeadersInit, BodyInit, Headers } from 'undici-types';

/*
 * General json typing
 */

export type JsonPrimitive = null | string | number | boolean;

export type JsonObject = Record<string, Json>;

export type JsonArray = Json[];

export type Json = JsonPrimitive | JsonObject | JsonArray;


export type JsonStringifyablePrimitive = null | undefined | string | number | boolean;

export type JsonStringifyableObject = Record<string, JsonStringifyable>;

export type JsonStringifyableArray = JsonStringifyable[];

export type JsonStringifyable = JsonStringifyablePrimitive | JsonStringifyableObject | JsonStringifyableArray | { toJSON(): JsonStringifyable };

/*
 * Param typing (like json but it supports dates if paramsSerializer is set to extended mode)
 */

export type ParamPrimitive = null | string | number | bigint | boolean | Date;

export type ParamObject = {
	[key: string]: ParamValue;
};

export type ParamArray = ParamValue[];

export type ParamValue = ParamPrimitive | ParamObject | ParamArray;

export type Params = ParamObject;

/*
 * Input and output types
 */

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | (string & {});

export type LissaOptionsInit = Omit<RequestInit, 'method' | 'body'> & {
	adapter?: 'fetch' | 'xhr';
	baseURL?: string;
	url?: string;
	method?: HttpMethod;
	authenticate?: { username: string, password: string };
	params?: Params;
	paramsSerializer?: 'simple' | 'extended' | ((params: Params) => string);
	urlBuilder?: 'simple' | 'extended' | ((url: string, baseURL: string) => string | URL);
	responseType?: 'json' | 'text' | 'file' | 'raw';
	timeout?: number;
	onUploadProgress?: (uploaded: number, total: number) => void;
	onDownloadProgress?: (downloaded: number, total: number) => void;
	body?: BodyInit | JsonStringifyableObject;
};

export type LissaOptions = Omit<LissaOptionsInit, 'headers'> & {
	headers: Headers
	params: Params;
};

export type DefaultOptionsInit = LissaOptionsInit & {
	get?: LissaOptionsInit;
	post?: LissaOptionsInit;
	put?: LissaOptionsInit;
	patch?: LissaOptionsInit;
	delete?: LissaOptionsInit;
};

export type DefaultOptions = LissaOptions & {
	get: LissaOptions;
	post: LissaOptions;
	put: LissaOptions;
	patch: LissaOptions;
	delete: LissaOptions;
};

export type FetchArguments = {
	url: URL,
	options: Omit<RequestInit, 'headers'> & { headers: Headers },
};

export type ResultData = null | string | Json | File | ReadableStream | Blob;

export type LissaResult<D = ResultData> = {
	options: LissaOptions;
	request: FetchArguments;
	response: Response;
	headers: Headers;
	status: number;
	data: D;
};

export interface TypeError extends Error {
	name: 'TypeError';
}

export interface TimeoutError extends DOMException {
	name: 'TimeoutError';
}

export interface AbortError extends DOMException {
	name: 'AbortError';
}

export type GeneralErrorResponse = (TimeoutError | AbortError) & {
	options: LissaOptions;
	request: FetchArguments;
};


/**
 * ConnectionError class for instance checking
 *
 * Will get thrown if a network-level error occurs (e.g. DNS resolution, connection lost)
 */
export declare class ConnectionError extends Error {
	name: 'ConnectionError';
	options: LissaOptions;
	request: FetchArguments;
}

/**
 * ResponseError class for instance checking
 *
 * Will get thrown when the server responds with a status code that indicates a failure (non-2xx status)
 */
export declare class ResponseError extends Error {
	name: 'ResponseError';
	options: LissaOptions;
	request: FetchArguments;
	response: Response;
	headers: Headers;
	status: number;
	data: null | string | Json | ReadableStream;
}

export type ExpectedError = GeneralErrorResponse | ConnectionError | ResponseError;
export type ThrownError = TypeError | ExpectedError;

export type ResultValue<D> = LissaResult<D>;

/*
 * Interfaces
 */

export declare class LissaRequest<RT = ResultValue<ResultData>> extends Promise<RT> {
	readonly options: LissaOptions;

	/**
	 * Set a base URL for the request
	 */
	baseURL(baseURL: string): LissaRequest<RT>;

	/**
	 * Set the request URL
	 */
	url(url: string): LissaRequest<RT>;

	/**
	 * Set the HTTP method (GET, POST, etc.)
	 */
	method(method: HttpMethod): LissaRequest<RT>;

	/**
	 * Add or override request headers
	 */
	headers(headers: HeadersInit): LissaRequest<RT>;

	/**
	 * Provide basic authentication credentials
	 *
	 * It sets the "Authorization" header to "Basic base64(username:password)"
	 */
	authenticate(username: string, password: string): LissaRequest<RT>;

	/**
	 * Add or override query string parameters
	 *
	 * Check the paramsSerializer option to control the serialization of the params
	 */
	params(params: Params): LissaRequest<RT>;

	/**
	 * Attach or merge a request body
	 *
	 * The body gets json stringified if it is a plain object
	 */
	body(body: BodyInit | JsonStringifyableObject): LissaRequest<RT>;

	/**
	 * Set request timeout in milliseconds
	 *
	 * Attaches an AbortSignal.timeout(...) signal to the request
	 */
	timeout(timeout: number): LissaRequest<RT>;

	/**
	 * Attach an AbortSignal to cancel the request
	 */
	signal(signal: AbortSignal): LissaRequest<RT>;

	/**
	 * Change the expected response type
	 */
	responseType(responseType: 'json' | 'text' | 'file' | 'raw'): LissaRequest<RT>;

	/**
	 * Add an upload progress listener
	 */
	onUploadProgress(onProgress: (uploaded: number, total: number) => void): LissaRequest<RT>;

	/**
	 * Add a download progress listener
	 */
	onDownloadProgress(onProgress: (downloaded: number, total: number) => void): LissaRequest<RT>;

	readonly status: 'pending' | 'fulfilled' | 'rejected';
	readonly value: void | RT;
	readonly reason: void | ThrownError;

	on(
		event: 'resolve',
		listener: (arg: RT) => void,
	): LissaRequest<RT>;

	on(
		event: 'reject',
		listener: (arg: ThrownError) => void,
	): LissaRequest<RT>;

	on(
		event: 'settle',
		listener: (arg: {
			status: 'fulfilled',
			value: RT,
			reason: void,
		} | {
			status: 'rejected',
			value: void,
			reason: ThrownError,
		}) => void,
	): LissaRequest<RT>;

	off(
		event: 'resolve' | 'reject' | 'settle',
		listener: (arg: RT | ThrownError | {
			status: 'fulfilled' | 'rejected',
			value: void | RT,
			reason: void | ThrownError,
		}) => void,
	): LissaRequest<RT>;
}

interface MakeRequest<RT> {

	/**
	 * Perform a GET request
	 */
	get<D = RT extends LissaResult<any> ? ResultData : RT>(
		url?: string,
		options?: Omit<LissaOptionsInit, 'method' | 'url'>
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;

	/**
	 * Perform a POST request with optional body
	 */
	post<D = RT extends LissaResult<any> ? ResultData : RT>(
		url?: string,
		body?: BodyInit | JsonStringifyableObject,
		options?: Omit<LissaOptionsInit, 'method' | 'url' | 'body'>
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;

	/**
	 * Perform a PUT request with optional body
	 */
	put<D = RT extends LissaResult<any> ? ResultData : RT>(
		url?: string,
		body?: BodyInit | JsonStringifyableObject,
		options?: Omit<LissaOptionsInit, 'method' | 'url' | 'body'>
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;

	/**
	 * Perform a PATCH request with optional body
	 */
	patch<D = RT extends LissaResult<any> ? ResultData : RT>(
		url?: string,
		body?: BodyInit | JsonStringifyableObject,
		options?: Omit<LissaOptionsInit, 'method' | 'url' | 'body'>
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;

	/**
	 * Perform a DELETE request
	 */
	delete<D = RT extends LissaResult<any> ? ResultData : RT>(
		url?: string,
		options?: Omit<LissaOptionsInit, 'method' | 'url'>
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;

	/**
	 * Perform a general fetch request.
	 *
	 * Specify url, method, body, headers and more in the given options object
	 */
	request<D = RT extends LissaResult<any> ? ResultData : RT>(
		options?: LissaOptionsInit
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;

	/**
	 * Upload a file
	 */
	upload<D = RT extends LissaResult<any> ? ResultData : RT>(
		file: File,
		url?: string,
		onProgress?: (uploaded: number, total: number) => void,
		options?: Omit<LissaOptionsInit, 'url'>,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;
	upload<D = RT extends LissaResult<any> ? ResultData : RT>(
		file: File,
		url?: string,
		options?: Omit<LissaOptionsInit, 'url'>,
		onProgress?: (uploaded: number, total: number) => void,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;
	upload<D = RT extends LissaResult<any> ? ResultData : RT>(
		file: File,
		onProgress?: (uploaded: number, total: number) => void,
		options?: LissaOptionsInit,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;
	upload<D = RT extends LissaResult<any> ? ResultData : RT>(
		file: File,
		options?: LissaOptionsInit,
		onProgress?: (uploaded: number, total: number) => void,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;

	/**
	 * Download a file
	 */
	download<D = RT extends LissaResult<any> ? File : RT>(
		url?: string,
		onProgress?: (downloaded: number, total: number) => void,
		options?: Omit<LissaOptionsInit, 'url'>,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;
	download<D = RT extends LissaResult<any> ? File : RT>(
		url?: string,
		options?: Omit<LissaOptionsInit, 'url'>,
		onProgress?: (downloaded: number, total: number) => void,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;
	download<D = RT extends LissaResult<any> ? File : RT>(
		onProgress?: (downloaded: number, total: number) => void,
		options?: LissaOptionsInit,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;
	download<D = RT extends LissaResult<any> ? File : RT>(
		options?: LissaOptionsInit,
		onProgress?: (downloaded: number, total: number) => void,
	): LissaRequest<RT extends LissaResult<any> ? LissaResult<D> : D>;
}

export type Plugin<RT> = (lissa: Lissa<RT>) => void;

export interface Lissa<RT = ResultValue<ResultData>> extends MakeRequest<RT> {
	/**
	 * Modify the base options directly.
	 *
	 * Keep in mind that removing an option that is still in the defaults defined
	 * will get merged back into the final request.
	 */
	readonly options: DefaultOptions;

	/**
	 * Register a plugin
	 *
	 * @example
	 * lissa.use(Lissa.retry());
	 */
	use(plugin: Plugin<RT>): Lissa<RT>;

	/**
	 * Add a beforeRequest hook into the request cycle.
	 *
	 * Modify the given options as argument or return a new options object.
	 */
	beforeRequest(hook: (options: LissaOptions) => void | LissaOptions | Promise<void | LissaOptions>): Lissa<RT>;

	/**
	 * Add a beforeFetch hook into the request cycle.
	 *
	 * Modify the actual fetch arguments or return new arguments.
	 */
	beforeFetch(hook: (request: FetchArguments) => void | FetchArguments | Promise<void | FetchArguments>): Lissa<RT>;

	/**
	 * Add an onResponse hook into the request cycle.
	 *
	 * React to successful responses or modify them. A provided return value will
	 * stop looping over existing hooks and instantly returns this value (if it
	 * is an instance of Error it will get thrown).
	 */
	onResponse<NRT = RT>(hook: (result: RT) => void | NRT | Error | Promise<void | NRT | Error>): Lissa<NRT>;

	/**
	 * Add an onError hook into the request cycle.
	 *
	 * React to errors or modify them. A provided return value will stop looping
	 * over existing hooks and instantly returns this value (if it is an instance
	 * of Error it will get thrown).
	 */
	onError<NRT = RT>(hook: (error: ExpectedError) => void | NRT | Error | Promise<void | NRT | Error>): Lissa<NRT>;

	/**
	 * Copy the current instance with all its options and hooks.
	 */
	extend(options: DefaultOptionsInit): Lissa<RT>;

	/**
	 * Provide basic authentication credentials
	 *
	 * It sets the "Authorization" header to "Basic base64(username:password)"
	 */
	authenticate(username: string, password: string): Lissa<RT>;
}

declare const LissaLib: MakeRequest<ResultValue<ResultData>> & NamedExports & {
	/**
	 * Perform a general fetch request.
	 *
	 * Specify method, body, headers and more in the given options object
	 */
	<D = ResultData>(
		url: string,
		options?: Omit<LissaOptionsInit, 'url'>
	): LissaRequest<ResultValue<D>>;

	/**
	 * Create a Lissa instance with the given base options.
	 */
	create(options: DefaultOptionsInit): Lissa<ResultValue<ResultData>>;
	create(
		baseURL?: string,
		options?: Omit<DefaultOptionsInit, 'baseURL'>
	): Lissa<ResultValue<ResultData>>;
};

export default LissaLib;

/**
 * Global default options.
 */
export declare const defaults: DefaultOptions;

/**
 * Retry plugin
 *
 * Retry requests on connection errors or server errors
 */
export declare const retry: (options?: RetryOptions) => Plugin<ResultValue<ResultData>>;

export type CustomRetryError = {
	/** custom retry type have to be returned by shouldRetry hook */
	[K in `@${string}`]: number;
};

export type RetryOptions = CustomRetryError & {
	'@ConnectionError'?: number;
	'@GatewayError'?: number;
	'@429'?: number;
	'@ServerError'?: number;

	/**
	 * Decide if the occurred error should trigger a retry.
	 *
	 * The given errorType helps preselecting error types. Return false to not
	 * trigger a retry. Return nothing if the given errorType is correct. Return
	 * a string to redefine the errorType or use a custom one. The number of
	 * maximum retries can be configured as `on${errorType}` or `@${errorType}`.
	 * Return "CustomError" and define the retries as { onCustomError: 3 } or
	 * as { '@CustomError': 3 }.
	 */
	shouldRetry?: (
		errorType: void | 'ConnectionError' | 'GatewayError' | '429' | 'ServerError',
		error: ExpectedError,
	) => void | false | string;

	/**
	 * Hook into the retry logic after the retry is triggered and before the delay
	 * is awaited. Use beforeRetry e. g. if you want to change how long the delay
	 * should be or to notify a customer that the connection is lost.
	 */
	beforeRetry?: (
		retry: { attempt: number, delay: number },
		error: ExpectedError,
	) => void | { attempt: number, delay: number };

	/**
	 * Hook into the retry logic after the delay is awaited and before the request
	 * gets resend. Use onRetry e. g. if you want to log that a retry is running now
	 */
	onRetry?: (
		retry: { attempt: number, delay: number },
		error: ExpectedError,
	) => void;

	/**
	 * Hook into the retry logic after a request was successful. Use onSuccess
	 * e. g. if you want to dismiss a connection lost notification
	 */
	onSuccess?: (
		retry: { attempt: number, delay: number },
		res: ResultValue<ResultData>,
	) => void;
};

/**
 * Dedupe plugin
 *
 * Aborts leading or trailing requests to the same endpoint (depends on configured strategy [default is leading])
 */
export declare const dedupe: (options?: DedupeOptions) => Plugin<ResultValue<ResultData>>;

export type DedupeOptions = {
	/**
	 * Which request methods should be deduped. Defaults to "get"
	 */
	methods?: HttpMethod[];

	/**
	 * How to build the endpoint identifier. Defaults to url + method.
	 * Return false to skip dedupe logic.
	 */
	getIdentifier?: (options: LissaOptions) => any;

	/**
	 * Define default strategy. Abort leading requests on new request or abort
	 * trailing new requests until first finishes. Can be also configured
	 * individually by adding a dedupe param to the request options.
	 */
	defaultStrategy?: 'leading' | 'trailing';
};

// Named exports are also params of the default export
interface NamedExports {
	defaults: typeof defaults;
	ConnectionError: typeof ConnectionError;
	ResponseError: typeof ResponseError;
	retry: typeof retry;
	dedupe: typeof dedupe;
}
