import express from 'express';

const PORT = 3000;

const index = {};

/*
 * Frontend side
 */
const script = (lissa) => {
	const fileInput = document.getElementById('fileInput');
	const uploadBtn = document.getElementById('uploadBtn');
	const abortBtn = document.getElementById('abortBtn');
	const progressBar = document.getElementById('progressBar');
	const status = document.getElementById('status');

	let abortController;

	abortBtn.style.display = 'none';
	abortBtn.addEventListener('click', () => {
		abortController.abort();

		abortBtn.style.display = 'none';
		uploadBtn.style.display = '';
	});

	uploadBtn.addEventListener('click', async () => {
		const file = fileInput.files[0];
		if (!file) {
			alert('Please select a file first!');
			return;
		}

		abortBtn.style.display = '';
		uploadBtn.style.display = 'none';

		status.textContent = 'Uploading...';
		progressBar.value = 0;

		try {
			abortController = new AbortController();

			await lissa
				.upload(file, '/upload', (uploaded, total) => {
					const progress = uploaded / total;
					progressBar.value = progress * 100;
				})
				.signal(abortController.signal);

			status.textContent = 'Upload complete!';
		}
		catch (err) {
			console.error(err);
			status.textContent = err.name === 'AbortError'
				? 'Upload aborted!'
				: 'Upload failed';
		}

		abortBtn.style.display = 'none';
		uploadBtn.style.display = '';
	});
};

index.html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Upload with Lissa</title>
	<style>
		body { font-family: sans-serif; margin: 2rem; }
		progress { width: 100%; height: 20px; }
	</style>
</head>
<body>
	<h1>Upload with Lissa + Progress</h1>
	<input type="file" id="fileInput">
	<button id="uploadBtn">Upload File</button>
	<button id="abortBtn">Abort upload</button>
	<p id="status"></p>
	<progress id="progressBar" value="0" max="100"></progress>

	<script type="module">
		import '/index.js';
	</script>
</body>
</html>
`;

index.js = `
import Lissa from '/lib/index.js';
(${script.toString()})(Lissa.create('http://localhost:${PORT}'));
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

server.post('/upload', async (req, res) => {
	const delay = 100; // ms delay between chunks

	req.on('data', () => {
		// Pausing the stream to slow down reading
		req.pause();

		setTimeout(() => {
			// Resuming after delay
			req.resume();
		}, delay);
	});

	req.on('end', () => {
		res.end();
	});

	req.on('error', (err) => {
		res.status(500).json({ error: err.message });
	});

	// Normal use case is more something like this
	// req.pipe(writeStream);
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
