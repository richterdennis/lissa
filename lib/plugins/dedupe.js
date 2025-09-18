const defaults = {
	methods: ['get'],
	getIdentifier: options => options.method + options.url,
	defaultStrategy: 'leading', // or trailing
};

export default (pluginOptions = {}) => (lissa) => {
	pluginOptions = Object.assign({}, defaults, pluginOptions);

	const requestMap = new Map();

	lissa.beforeRequest(function beforeRequest(options) {
		if (!options.dedupe && !pluginOptions.methods.includes(options.method)) return;

		const dedupeStrategy = options.dedupe || pluginOptions.defaultStrategy;
		if (dedupeStrategy === false) return;

		const id = pluginOptions.getIdentifier(options);
		if (!id) return;

		let running = requestMap.get(id);
		if (!running) requestMap.set(id, running = { value: 0, abortController: null });

		running.value++;
		this.on('settle', () => --running.value);

		if (dedupeStrategy === 'trailing' && running.value > 1) {
			options.signal = AbortSignal.abort();
			return;
		}

		running.abortController?.abort();
		running.abortController = new AbortController();

		if (options.signal) {
			options.signal = AbortSignal.any([
				options.signal,
				running.abortController.signal,
			]);
		}
		else {
			options.signal = running.abortController.signal;
		}
	});
};
