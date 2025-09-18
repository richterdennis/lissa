/* eslint-disable no-unused-vars */
import Lissa from '../lib/index.js';

/*
 * Checking for error.name is the easiest way to check what error occurred
 *
 * TypeErrors are not getting passed to onError hooks
 * They are basically input/config errors
 *
 * To cancel a request use AbortSignal to get TimeoutErrors and AbortErrors
 *
 * ConnectionErrors occur if the request is blocked by a permissions policy or
 * there is a network error / server not reachable
 *
 * ResponseErrors will get thrown when the server responds with a status code
 * that indicates a failure (non-2xx status)
 */

try {
	await Lissa.get('http://localhost:99999');
}
catch (error) {
	// TypeError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'TypeError',
		name: 'TypeError',
		message: 'Invalid URL',
		code: 'ERR_INVALID_URL',
		input: 'http://localhost:99999'
	}
	*/
}

try {
	await Lissa.get('http://localhost', {
		credentials: 'foobar',
	});
}
catch (error) {
	// TypeError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'TypeError',
		name: 'TypeError',
		message: 'Request constructor: foobar is not an accepted type. Expected one of omit, same-origin, include.'
	}
	*/
}

try {
	await Lissa.get('http://localhost', {
		signal: AbortSignal.timeout(0),
	});
}
catch (error) {
	// TimeoutError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,
		options,
		request,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'DOMException',
		name: 'TimeoutError',
		message: 'The operation was aborted due to timeout'
	}
	*/
}

try {
	await Lissa.get('http://localhost', {
		signal: AbortSignal.abort(),
	});
}
catch (error) {
	// AbortError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,
		options,
		request,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'DOMException',
		name: 'AbortError',
		message: 'This operation was aborted'
	}
	*/
}

try {
	class CustomError extends Error {};
	await Lissa.get('http://localhost', {
		signal: AbortSignal.abort(new CustomError('A Custom Error')),
	});
}
catch (error) {
	// CustomError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,
		options,
		request,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'CustomError',
		name: 'Error',
		message: 'A Custom Error'
	}
	*/
}

try {
	await Lissa.get('http://not-existing');
}
catch (error) {
	// ConnectionError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,
		options,
		request,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'ConnectionError',
		name: 'ConnectionError',
		message: 'ConnectionError',
		errno: -3008,
		code: 'ENOTFOUND',
		syscall: 'getaddrinfo',
		hostname: 'not-existing'
	}
	*/
}

try {
	await Lissa.get('http://localhost:42042');
}
catch (error) {
	// ConnectionError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,
		options,
		request,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'ConnectionError',
		name: 'ConnectionError',
		message: 'ConnectionError',
		code: 'ECONNREFUSED'
	}
	*/
}

try {
	// Thank you jsonplaceholder.typicode.com
	await Lissa.get('https://jsonplaceholder.typicode.com/posts/99999');
}
catch (error) {
	// ResponseError
	const instanceOf = error.constructor.name;

	const {
		name,
		message,

		// Omit params to keep console log small
		stack,
		options,
		request,
		response,
		headers,

		...additionalParams
	} = error;

	console.log({ instanceOf, name, message, ...additionalParams });

	/*
	{
		instanceOf: 'ResponseError',
		name: 'ResponseError',
		message: 'ResponseError',
		status: 404,
		data: {},
		type: 'json'
	}
	*/
}
