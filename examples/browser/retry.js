import express from 'express';

const PORT = 3000;

const index = {};

/*
 * Frontend side
 */
const script = (Lissa, baseURL) => {
	const startRequest = document.getElementById('startRequest');
	const status = document.getElementById('status');
	const notification = document.getElementById('notification');

	const lissa = Lissa.create(baseURL);

	lissa.use(Lissa.retry({
		// Browser default settings
		onConnectionError: Infinity, // How many retries if no connection?
		onGatewayError: Infinity, // How many retries if gateway responds with >= 502 && <= 504?
		on429: Infinity, // How many retries if server responds with 429?
		onServerError: 0, // How many retries if server responds with 500?

		/* Node default settings
		onConnectionError: 3,
		onGatewayError: 3,
		on429: 3,
		onServerError: 3,
		*/

		beforeRetry({ attempt }, err) {
			console.error(err);

			// attempt > 0 -> beforeRetry = after retry
			if (attempt === 2) notification.textContent = 'Lost connection to the server!';
		},

		onSuccess() {
			notification.textContent = '';
		},
	}));

	startRequest.addEventListener('click', async () => {
		startRequest.disabled = true;
		status.textContent = 'Request running';

		try {
			await lissa.get('/endpoint');
			status.textContent = 'Request finished';
		}
		catch (err) {
			console.error(err);
			status.textContent = 'Request failed';
		}

		startRequest.disabled = false;
	});
};

index.html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Retry Plugin</title>
	<style>
		body { font-family: sans-serif; margin: 2rem; }
	</style>
</head>
<body>
	<h1>Retry Plugin</h1>
	<p>Open the network panel in the dev tools to see requests. Stop and start the server.</p>

	<button id="startRequest">Start Request</button>
	<p id="status"></p>
	<p id="notification"></p>

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

server.get('/endpoint', async (req, res) => {
	res.end();
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
