import Lissa from '../lib/index.js';

// Example 1: Using reviver to convert ISO date strings to Date objects
console.log('=== Example 1: Date Revival ===\n');

// Create a reviver function that detects ISO 8601 date strings
function dateReviver(key, value) {
	// Pattern to match ISO 8601 date strings like "2026-07-01T12:34:56.789Z"
	const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

	if (typeof value === 'string' && isoDatePattern.test(value)) {
		return new Date(value);
	}

	return value;
}

// Create a Lissa instance with the reviver
const lissa = Lissa.create({
	baseURL: 'https://jsonplaceholder.typicode.com',
	reviver: dateReviver,
});

// Simulate an API response with date strings
const mockResponse = {
	id: 123,
	title: 'Team Meeting',
	createdAt: '2026-07-01T10:00:00.000Z',
	updatedAt: '2026-07-01T15:30:00.000Z',
	participants: [
		{ name: 'Alice', joinedAt: '2026-07-01T10:05:00.000Z' },
		{ name: 'Bob', joinedAt: '2026-07-01T10:10:00.000Z' },
	],
};

console.log('Mock API Response:');
console.log(JSON.stringify(mockResponse, null, 2));
console.log();

// Parse with reviver to demonstrate the functionality
const revivedData = JSON.parse(JSON.stringify(mockResponse), dateReviver);

console.log('After reviver processing:');
console.log('- createdAt is Date:', revivedData.createdAt instanceof Date);
console.log('- updatedAt is Date:', revivedData.updatedAt instanceof Date);
console.log('- participants[0].joinedAt is Date:', revivedData.participants[0].joinedAt instanceof Date);
console.log('- createdAt value:', revivedData.createdAt.toLocaleString());
console.log('- Meeting duration:', (revivedData.updatedAt - revivedData.createdAt) / 1000 / 60, 'minutes');
console.log();

// Example 2: Using replacer to filter private properties
console.log('=== Example 2: Data Filtering with Replacer ===\n');

const userData = {
	name: 'John Doe',
	email: 'john@example.com',
	_internalId: 'xyz789',
	_debug: 'This is internal data',
	role: 'admin',
};

console.log('Original user data:');
console.log(userData);
console.log();

// Replacer function to exclude private properties (starting with _)
function privateReplacer(key, value) {
	if (key.startsWith('_')) {
		return undefined; // Exclude these properties
	}
	return value;
}

const filteredJson = JSON.stringify(userData, privateReplacer, 2);
console.log('Filtered JSON (_internal fields removed):');
console.log(filteredJson);
console.log();

// Example 3: Combined usage with Lissa
console.log('=== Example 3: Using with Lissa Requests ===\n');

const apiClient = Lissa.create({
	baseURL: 'https://jsonplaceholder.typicode.com',
	replacer: (key, value) => {
		// Don't send properties starting with underscore
		if (key.startsWith('_')) return undefined;
		return value;
	},
	reviver: (key, value) => {
		// Convert date strings to Date objects
		if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
			return new Date(value);
		}
		return value;
	},
});

console.log('Created Lissa client with replacer and reviver');
console.log('- Replacer: Filters out properties starting with "_"');
console.log('- Reviver: Converts ISO date strings to Date objects');
console.log();

// Example request (will use the configured replacer/reviver)
try {
	console.log('Making a test request to /posts/1...');
	const { data } = await apiClient.post('/posts', {
		title: 'Foo',
		createdAt: new Date(),
		_nothing: 'here',
	});
	console.log('Response received:');
	console.log(data);
}
catch (error) {
	console.error('Request failed:', error.message);
}
