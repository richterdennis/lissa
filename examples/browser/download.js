import express from 'express';

const PORT = 3000;

const index = {};

/*
 * Frontend side
 */
const script = (lissa) => {
	// lissa.options.adapter = 'xhr';

	const downloadBtn = document.getElementById('downloadBtn');
	const abortBtn = document.getElementById('abortBtn');
	const progressBar = document.getElementById('progressBar');
	const status = document.getElementById('status');

	let abortController;

	abortBtn.style.display = 'none';
	abortBtn.addEventListener('click', () => {
		abortController.abort();

		abortBtn.style.display = 'none';
		downloadBtn.style.display = '';
	});

	downloadBtn.addEventListener('click', async () => {
		abortBtn.style.display = '';
		downloadBtn.style.display = 'none';

		status.textContent = 'Downloading...';
		progressBar.value = 0;

		try {
			/* For just downloading a file to disk create a link to download the file
			const a = document.createElement('a');
			a.href = 'https://your-website/download';
			a.click();
			*/

			abortController = new AbortController();
			const { data: file } = await lissa
				.download('/download', (downloaded, total) => {
					const progress = downloaded / total;
					progressBar.value = progress * 100;
				})
				.signal(abortController.signal);

			console.log(file.name, await file.arrayBuffer());

			status.textContent = 'Download complete!';
		}
		catch (err) {
			console.error(err);
			status.textContent = err.name === 'AbortError'
				? 'Download aborted!'
				: 'Download failed';
		}

		abortBtn.style.display = 'none';
		downloadBtn.style.display = '';
	});
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
	<h1>Download with Lissa + Progress</h1>
	<button id="downloadBtn">Download File</button>
	<button id="abortBtn">Abort download</button>
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

server.get('/download', async (req, res) => {
	const fileName = 'large-file.txt';
	const totalSize = 10 * 1024 * 1024; // 10 MB
	const chunkSize = 64 * 1024; // 64 KB per chunk
	const delay = 100; // ms delay between chunks

	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
	res.setHeader('Content-Length', totalSize);

	for (let sent = 0; sent < totalSize && !req.destroyed; sent += chunkSize) {
		const chunk = Buffer.alloc(Math.min(chunkSize, totalSize - sent), 'A');
		res.write(chunk);
		await new Promise(resolve => setTimeout(resolve, delay));
	}

	// Normal use case is more something like this
	// res.download(filePath);

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
