import express from 'express';

const PORT = 3000;

const index = {};

/*
 * Frontend side
 */
const script = (Lissa, baseURL) => {
	const lissa = Lissa.create(baseURL);

	lissa.use(Lissa.dedupe());

	const dedupeStrategyForm = document.getElementById('dedupeStrategy');
	const fireBtn = document.getElementById('fireBtn');
	const status = document.getElementById('status');

	const openRequests = new Set();
	status.textContent = `Open requests: ${openRequests.size}`;

	fireBtn.addEventListener('click', async () => {
		// dedupeStrategy -> 'leading' or 'trailing'
		const dedupeStrategy = new FormData(dedupeStrategyForm).get('strategy');

		const req = lissa.get('/long-running-endpoint', { dedupe: dedupeStrategy });
		openRequests.add(req);
		status.textContent = `Open requests: ${openRequests.size}`;

		try {
			await req;
		}
		catch (err) {
			console.error(err);
		}

		openRequests.delete(req);
		status.textContent = `Open requests: ${openRequests.size}`;
	});
};

index.html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Dedupe Plugin</title>
	<style>
		body { font-family: sans-serif; margin: 2rem; }
	</style>
</head>
<body>
	<h1>Dedupe Plugin</h1>
	<p>Open the network panel in the dev tools to see aborted requests</p>

	<form id="dedupeStrategy">
		<fieldset>
			<legend>Select a dedupe strategy:</legend>
			<div>
				<input type="radio" id="leading" name="strategy" value="leading" checked />
				<label for="leading">leading - Abort leading requests</label>
			</div>
			<div>
				<input type="radio" id="trailing" name="strategy" value="trailing" />
				<label for="trailing">trailing - Abort trailing requests</label>
			</div>
		</fieldset>
	</form>

	<p></p>

	<button id="fireBtn">Start Request - Spam Me :)</button>
	<p id="status"></p>

	<script type="module">
		import '/index.js';
	</script>
</body>
</html>
`;

index.js = `
import Lissa from '/lib/index.js';
(${script.toString()})(Lissa, 'http://localhost:${PORT}');
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

server.get('/long-running-endpoint', async (req, res) => {
	const { promise, resolve } = Promise.withResolvers();
	const timeout = setTimeout(resolve, 4000);

	function resolvePromiseEarly() {
		clearTimeout(timeout);
		resolve();
	}

	// Close is emitted if the underlying socket closes. No matter if the browser
	// or server ending the connection
	req.on('close', resolvePromiseEarly);

	await promise;

	req.off('close', resolvePromiseEarly);
	console.log('Request aborted: ', req.destroyed);

	// res.end() does nothing if underlying socket is already closed so it doesn't
	// actually matter if you properly handle request abortion in most cases
	if (!req.destroyed) res.end();
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
