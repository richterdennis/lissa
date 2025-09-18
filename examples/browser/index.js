import express from 'express';

const PORT = 3000;

const index = {};

/*
 * Frontend side
 */
const script = async (Lissa) => {
	// Lissa.defaults.adapter = 'xhr'; // Test xhr adapter

	const lissa = Lissa.create({
		// Thank you jsonplaceholder.typicode.com
		baseURL: 'https://jsonplaceholder.typicode.com',
	});

	lissa.onResponse(async (result) => {
		// Omit params to keep console log small
		delete result.options;
		delete result.request;
		delete result.response;
		delete result.headers;
	});

	console.log(
		await lissa.get('/posts/1'),
	);

	console.log(
		await lissa.post('/posts', {
			title: 'foo',
			body: 'bar',
			userId: 1,
		}),
	);

	console.log(
		await lissa.put('/posts/1', {
			id: 1,
			title: 'foo',
			body: 'bar',
			userId: 1,
		}),
	);

	console.log(
		await lissa.patch('/posts/1', {
			title: 'foo',
		}),
	);

	console.log(
		await lissa.delete('/posts/1'),
	);

	console.log(
		await lissa.get('/posts').params({ userId: 1 }),
	);

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
