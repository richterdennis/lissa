/* eslint-disable no-unused-vars */
import express from 'express';

const PORT = 3000;

const index = {};

/*
 * Frontend side
 */
const script = async (Lissa) => {
	// Lissa.defaults.adapter = 'xhr'; // Test xhr adapter

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
			message: 'Failed to construct 'URL': Invalid URL',
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
			message: 'signal timed out'
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
			message: 'signal is aborted without reason'
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
			message: 'ConnectionError'
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
};

index.html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Download with Lissa</title>
	<style>
		body { font-family: sans-serif; margin: 2rem; }
		progress { width: 100%; height: 20px; }
	</style>
</head>
<body>
	<h1>Open Console</h1>
	<script type="module">
		import '/index.js';
	</script>
</body>
</html>
`;

index.js = `
import Lissa from '/lib/index.js';
(${script.toString()})(Lissa);
`;

/*
 * Server side
 */
const server = express();

server.use((req, res, next) => {
	console.log(
		(new Date()).toISOString().replace('T', ' ').slice(0, 19),
		req.method,
		req.path,
	);
	next();
});

server.get('/', (req, res) => {
	res.setHeader('Content-Type', 'text/html');
	res.send(index.html);
});

server.get('/index.js', (req, res) => {
	res.setHeader('Content-Type', 'application/javascript');
	res.send(index.js);
});

server.use('/lib', express.static(`${import.meta.dirname}/../../lib`));

server.listen(PORT, (err) => {
	if (err) throw err;
	console.log(`Open http://localhost:${PORT}`);
});
