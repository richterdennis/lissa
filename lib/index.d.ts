import { RequestInit, HeadersInit, BodyInit, Headers } from 'undici-types';

/*
 * General json typing
 */

export type JsonPrimitive = null | string | number | boolean;

export type JsonObject = {
	[key: string]: Json;
};

export type JsonArray = Json[];

export type Json = JsonPrimitive | JsonObject | JsonArray;

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
	body?: BodyInit | JsonObject;
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

export type LissaResult = {
	options: LissaOptions;
	request: FetchArguments;
	response: Response;
	headers: Headers;
	status: number;
	data: null | string | Json | File | ReadableStream | Blob;
};

export type GeneralErrorResponse = Error & {
	options: LissaOptions;
	request: FetchArguments;
};

export type ResultValue = LissaResult | Exclude<any, undefined>;

/*
 * Interfaces
 */

export declare class LissaRequest extends Promise<ResultValue> {
	readonly options: LissaOptions;

	/**
	 * Set a base URL for the request
	 */
	baseURL(baseURL: string): LissaRequest;

	/**
	 * Set the request URL
	 */
	url(url: string): LissaRequest;

	/**
	 * Set the HTTP method (GET, POST, etc.)
	 */
	method(method: HttpMethod): LissaRequest;

	/**
	 * Add or override request headers
	 */
	headers(headers: HeadersInit): LissaRequest;

	/**
	 * Provide basic authentication credentials
	 *
	 * It sets the "Authorization" header to "Basic base64(username:password)"
	 */
	authenticate(username: string, password: string): LissaRequest;

	/**
	 * Add or override query string parameters
	 *
	 * Check the paramsSerializer option to control the serialization of the params
	 */
	params(params: Params): LissaRequest;

	/**
	 * Attach or merge a request body
	 *
	 * The body gets json stringified if it is a plain object
	 */
	body(body: BodyInit | JsonObject): LissaRequest;

	/**
	 * Set request timeout in milliseconds
	 *
	 * Attaches an AbortSignal.timeout(...) signal to the request
	 */
	timeout(timeout: number): LissaRequest;

	/**
	 * Attach an AbortSignal to cancel the request
	 */
	signal(signal: AbortSignal): LissaRequest;

	/**
	 * Change the expected response type
	 */
	responseType(responseType: 'json' | 'text' | 'file' | 'raw'): LissaRequest;

	/**
	 * Add an upload progress listener
	 */
	onUploadProgress(onProgress: (uploaded: number, total: number) => void): LissaRequest;

	/**
	 * Add a download progress listener
	 */
	onDownloadProgress(onProgress: (downloaded: number, total: number) => void): LissaRequest;

	readonly status: 'pending' | 'fulfilled' | 'rejected';
	readonly value: void | ResultValue;
	readonly reason: void | Error;

	on(
		event: 'resolve' | 'reject' | 'settle',
		listener: (arg: ResultValue | Error | {
			status: 'fulfilled' | 'rejected',
			value: void | ResultValue,
			reason: void | Error,
		}) => void,
	): LissaRequest;

	off(
		event: 'resolve' | 'reject' | 'settle',
		listener: (arg: ResultValue | Error | {
			status: 'fulfilled' | 'rejected',
			value: void | ResultValue,
			reason: void | Error,
		}) => void,
	): LissaRequest;
}

interface MakeRequest {

	/**
	 * Perform a GET request
	 */
	get(
		url?: string,
		options?: Omit<LissaOptionsInit, 'method' | 'url'>
	): LissaRequest;

	/**
	 * Perform a POST request with optional body
	 */
	post(
		url?: string,
		body?: BodyInit | JsonObject,
		options?: Omit<LissaOptionsInit, 'method' | 'url' | 'body'>
	): LissaRequest;

	/**
	 * Perform a PUT request with optional body
	 */
	put(
		url?: string,
		body?: BodyInit | JsonObject,
		options?: Omit<LissaOptionsInit, 'method' | 'url' | 'body'>
	): LissaRequest;

	/**
	 * Perform a PATCH request with optional body
	 */
	patch(
		url?: string,
		body?: BodyInit | JsonObject,
		options?: Omit<LissaOptionsInit, 'method' | 'url' | 'body'>
	): LissaRequest;

	/**
	 * Perform a DELETE request
	 */
	delete(
		url?: string,
		options?: Omit<LissaOptionsInit, 'method' | 'url'>
	): LissaRequest;

	/**
	 * Perform a general fetch request.
	 *
	 * Specify url, method, body, headers and more in the given options object
	 */
	request(options?: LissaOptionsInit): LissaRequest;

	/**
	 * Upload a file
	 */
	upload(
		file: File,
		url?: string,
		onProgress?: (uploaded: number, total: number) => void,
		options?: Omit<LissaOptionsInit, 'url'>,
	): LissaRequest;
	upload(
		file: File,
		url?: string,
		options?: Omit<LissaOptionsInit, 'url'>,
		onProgress?: (uploaded: number, total: number) => void,
	): LissaRequest;
	upload(
		file: File,
		onProgress?: (uploaded: number, total: number) => void,
		options?: LissaOptionsInit,
	): LissaRequest;
	upload(
		file: File,
		options?: LissaOptionsInit,
		onProgress?: (uploaded: number, total: number) => void,
	): LissaRequest;

	/**
	 * Download a file
	 */
	download(
		url?: string,
		onProgress?: (downloaded: number, total: number) => void,
		options?: Omit<LissaOptionsInit, 'url'>,
	): LissaRequest;
	download(
		url?: string,
		options?: Omit<LissaOptionsInit, 'url'>,
		onProgress?: (downloaded: number, total: number) => void,
	): LissaRequest;
	download(
		onProgress?: (downloaded: number, total: number) => void,
		options?: LissaOptionsInit,
	): LissaRequest;
	download(
		options?: LissaOptionsInit,
		onProgress?: (downloaded: number, total: number) => void,
	): LissaRequest;
}

export type Plugin = (lissa: Lissa) => void;

export interface Lissa extends MakeRequest {
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
	use(plugin: Plugin): Lissa;

	/**
	 * Add a beforeRequest hook into the request cycle.
	 *
	 * Modify the given options as argument or return a new options object.
	 */
	beforeRequest(hook: (options: LissaOptions) => void | LissaOptions): Lissa;

	/**
	 * Add a beforeFetch hook into the request cycle.
	 *
	 * Modify the actual fetch arguments or return new arguments.
	 */
	beforeFetch(hook: (request: FetchArguments) => void | FetchArguments): Lissa;

	/**
	 * Add an onResponse hook into the request cycle.
	 *
	 * React to successful responses or modify them. A provided return value will
	 * stop looping over existing hooks and instantly returns this value (if it
	 * is an instance of Error it will get thrown).
	 */
	onResponse(hook: (result: LissaResult) => void | Exclude<any, undefined>): Lissa;

	/**
	 * Add an onError hook into the request cycle.
	 *
	 * React to errors or modify them. A provided return value will stop looping
	 * over existing hooks and instantly returns this value (if it is an instance
	 * of Error it will get thrown).
	 */
	onError(hook: (error: ResponseError | ConnectionError | GeneralErrorResponse) => void | Exclude<any, undefined>): Lissa;

	/**
	 * Copy the current instance with all its options and hooks.
	 */
	extend(options: DefaultOptionsInit): Lissa;

	/**
	 * Provide basic authentication credentials
	 *
	 * It sets the "Authorization" header to "Basic base64(username:password)"
	 */
	authenticate(username: string, password: string): Lissa;
}

declare const LissaLib: MakeRequest & NamedExports & {
	/**
	 * Perform a general fetch request.
	 *
	 * Specify method, body, headers and more in the given options object
	 */
	(
		url: string,
		options?: Omit<LissaOptionsInit, 'url'>
	): LissaRequest;

	/**
	 * Create a Lissa instance with the given base options.
	 */
	create(options: DefaultOptionsInit): Lissa;
	create(
		baseURL?: string,
		options?: Omit<DefaultOptionsInit, 'baseURL'>
	): Lissa;
};

export default LissaLib;

/**
 * Global default options.
 */
export declare const defaults: DefaultOptions;


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

/**
 * Retry plugin
 *
 * Retry requests on connection errors or server errors
 */
export declare const retry: (options?: RetryOptions) => Plugin;

export type CustomRetryError = {
	/** custom retry type have to be returned by shouldRetry hook */
	[K in `on${string}`]: number;
};

export type RetryOptions = CustomRetryError & {
	onConnectionError?: number;
	onGatewayError?: number;
	on429?: number;
	onServerError?: number;

	/**
	 * Decide if the occurred error should trigger a retry.
	 *
	 * The given errorType helps preselecting error types. Return false to not
	 * trigger a retry. Return nothing if the given errorType is correct. Return
	 * a string to redefine the errorType or use a custom one. The number of
	 * maximum retries can be configured as `on${errorType}`. Return "CustomError"
	 * and define the retries as { onCustomError: 3 }
	 */
	shouldRetry?: (
		errorType: void | 'ConnectionError' | 'GatewayError' | '429' | 'ServerError',
		error: ResponseError | ConnectionError | GeneralErrorResponse,
	) => void | false | string;

	/**
	 * Hook into the retry logic after the retry is triggered and before the delay
	 * is awaited. Use beforeRetry e. g. if you want to change how long the delay
	 * should be or to notify a customer that the connection is lost.
	 */
	beforeRetry?: (
		retry: { attempt: number, delay: number },
		error: ResponseError | ConnectionError | GeneralErrorResponse,
	) => void | { attempt: number, delay: number };

	/**
	 * Hook into the retry logic after the delay is awaited and before the request
	 * gets resend. Use onRetry e. g. if you want to log that a retry is running now
	 */
	onRetry?: (
		retry: { attempt: number, delay: number },
		error: ResponseError | ConnectionError | GeneralErrorResponse,
	) => void;

	/**
	 * Hook into the retry logic after a request was successful. Use onSuccess
	 * e. g. if you want to dismiss a connection lost notification
	 */
	onSuccess?: (
		retry: { attempt: number, delay: number },
		res: ResultValue,
	) => void;
};

/**
 * Dedupe plugin
 *
 * Aborts leading or trailing requests to the same endpoint (depends on configured strategy [default is leading])
 */
export declare const dedupe: (options?: DedupeOptions) => Plugin;

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
