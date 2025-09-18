const browserDefaults = {
	onConnectionError: Infinity,
	onGatewayError: Infinity,
	on429: Infinity,
	onServerError: 0,
};

const nodeDefaults = {
	onConnectionError: 3,
	onGatewayError: 3,
	on429: 3,
	onServerError: 3,
};

// Expecting to connect to own service in browser and vendor services in node
const defaults = typeof window === 'undefined' ? nodeDefaults : browserDefaults;

export default (options = {}) => (lissa) => {
	options = Object.assign({}, defaults, options);

	lissa.onError(async (error) => {
		let errorType;
		if (error.name === 'ConnectionError') errorType = 'ConnectionError';
		else if (error.status === 429) errorType = '429';
		else if (error.status === 500) errorType = 'ServerError';
		else if (error.status >= 502 && error.status <= 504) errorType = 'GatewayError';

		if (options.shouldRetry) {
			const shouldRetry = await options.shouldRetry(errorType, error);
			if (shouldRetry === false) return;
			if (typeof shouldRetry === 'string') errorType = shouldRetry;
		}

		// Return nothing to hand over the error to the next onError hook
		if (!errorType) return;

		// Initialize
		let retry = error.options.retry || { attempt: 1, delay: 1000 };

		if (options.beforeRetry) {
			retry = await options.beforeRetry(retry, error) || retry;
		}

		// Return nothing to hand over the error to the next onError hook
		if (retry.attempt > (options[`on${errorType}`] || 0)) return;

		await new Promise(resolve => setTimeout(resolve, retry.delay));

		if (options.onRetry) {
			await options.onRetry({ ...retry }, error);
		}

		error.options.retry = {
			attempt: retry.attempt + 1,
			// await 1 sec on first retry, 2 sec on second retry ... (but max 5 sec)
			delay: Math.min(1000 * (retry.attempt + 1), 5000),
		};

		const request = lissa.request(error.options);

		if (options.onSuccess) request.then(res => options.onSuccess({ ...retry }, res));

		return request;
	});
};
