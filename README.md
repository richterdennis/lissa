# Lissa

> A lightweight, extensible HTTP client for modern JavaScript applications

Lissa is a powerful yet minimal HTTP library that brings simplicity back to API interactions. Built on the native Fetch API, it offers a fluent, promise-based interface with zero dependencies while providing advanced features like intelligent retries, request deduplication, and progress tracking.

Whether you're building a complex web application or a simple Node.js service, Lissa adapts to your needs with its plugin-driven architecture and universal compatibility.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Fluent API](#fluent-api)
- [Built-in Plugins](#built-in-plugins)
- [Error Types](#error-types)
- [Examples](#examples)
- [Browser Support](#browser-support)
- [License](#license)

## Features

- **Promise-based fluent API**: Modern async/await support with clean, intuitive syntax
- **Universal**: Works seamlessly in both Node.js and browser environments
- **Plugin Architecture**: Easily extend functionality with plugins (dedupe and retry are built-in)
- **Request/Response Hooks**: Powerful hooks for customizing request/response handling
- **File Operations**: Built-in support for file uploads and downloads with progress tracking
- **Error Handling**: Custom error classes for robust error management
- **TypeScript Support**: Full TypeScript definitions included
- **Lightweight**: No dependencies, built on native Fetch API
- **Flexible Configuration**: Instance-based configuration with inheritance and extension

## Installation

```bash
npm install lissa
```

## Usage

In this documentation we reference the Lissa class as `Lissa` and a reference to a Lissa instance as `lissa`.

### Basic Example

```js
import Lissa from "lissa";

// Direct function call
const { data } = await Lissa("https://api.example.com/data");

// Use HTTP methods
const { data: users } = await Lissa.get("https://api.example.com/users");
const { data: newUser } = await Lissa.post("https://api.example.com/users", {
  name: "John Doe",
  email: "john@example.com"
});

// Create a configured instance
const lissa = Lissa.create({
  baseURL: "https://api.example.com",
  headers: { "Authorization": "Bearer token" }
});

// Use HTTP methods on the instance
const { data: user } = await lissa.get("/users/1");
const { data: newPost } = await lissa.post("/posts", { title: "Hello", body: "World" });
```

### Using Plugins

```js
import Lissa from "lissa";

const lissa = Lissa.create("https://api.example.com");

lissa.use(Lissa.retry());

const { data } = await lissa.get("/data");
```

### Advanced Example

```js
import Lissa from "lissa";

const lissa = Lissa.create({
  baseURL: CONFIG.API_ADDRESS,
  headers: {
    "X-Api-Key": CONFIG.API_KEY,
  },
  paramsSerializer: "extended",
  credentials: "include",
});

lissa.use(Lissa.dedupe());

lissa.use(Lissa.retry({
  beforeRetry({ attempt }) {
    if (attempt !== 2) return;
    Notify.error("The connection to the server was interrupted!");
  },

  onSuccess() {
    dismissDisconnectError();
  },
}));

lissa.onError(async (error) => {
  if (error.name === "ResponseError" && error.status === 401) {
    await Session.logout();
    Notify.info("Your session has expired! Please log in again.");
    error.handled = true;
    throw error;
  }
});

```

## API

### `options` Object

Any property that is not listed below will get handed over to the underlying fetch call as is.
Checkout https://developer.mozilla.org/en-US/docs/Web/API/RequestInit for available properties.

| Property   | Type   | Default Value    | Description                         |
|------------|--------|------------------|-------------------------------------|
| baseURL            | string                             | ""        | Will be prepended to "url".
| url                | string                             | ""        | The resource to fetch.
| method             | string                             | "get"     | A http request method
| authenticate       | { username, password }             | undefined | Basic authentication
| headers            | Headers                            | {}        | HTTP headers
| params             | object                             | {}        | Query params
| paramsSerializer   | "simple", "extended" or Function   | "simple"  | How to serialize the query params
| urlBuilder         | "simple", "extended" or Function   | "simple"  | How to build the final fetch url from the defined "baseURL" and "url"
| responseType       | "json", "text", "file" or "raw"    | "json"    | The type of data that the server will respond with
| timeout            | number                             | undefined | Specify the number of milliseconds before the request gets aborted
| signal             | AbortSignal                        | undefined | Cancel/Abort running requests
| body               | object, buffer, stream, file, etc. | undefined | Request body

#### paramsSerializer option
Set the paramsSerializer option to "simple", "extended" or a custom query string params serializer function. Inspired by [express](https://www.npmjs.org/package/express) "simple" and "extended" serializes the params like ["node:querystring"](http://nodejs.org/api/querystring.html) or [qs](https://www.npmjs.org/package/qs). It is set to "simple" by default. A custom function will receive an object of query param keys and their values, and must return the complete query string.

#### urlBuilder option
Set the urlBuilder option to "simple", "extended" or a custom build function.
- "simple" simply concatenates baseURL and url as strings (default)
- "extended" is using the URL constructor new URL(url, baseURL);
- A custom function will receive url and baseURL, and must return the complete url as string or URL instance

Make sure to not forget a needed slash using "simple". If using "extended" be careful with leading and trailing slashes in urls, the baseURL and also with sub paths in the baseURL. For example `new URL("todos", "http://api.example.com/v2")` and `new URL("/todos", "http://api.example.com/v2/")` both results in a fetch to `"http://api.example.com/todos"`. Only `new URL("todos", "http://api.example.com/v2/")` will result in a fetch to the expected `"http://api.example.com/v2/todos"`.

### `result` Object/Error

Every request returns a promise which gets fulfilled into a result object or rejected into a result error.
Both provide the following properties:

| Property   | Type    | Description                                   |
|------------|---------|-----------------------------------------------|
| options    | object  | The options used to make the request          |
| request    | object  | The arguments with which the fetch got called |
| response   | object  | The underlying fetch response                 |
| headers    | Headers | The response headers                          |
| status     | number  | The response status code                      |
| data       | object  | The response data                             |


### Call Lissa as Function - Lissa()
Performs a general fetch request. Specify method, body, headers and more in the given options object.

#### Syntax
```js
Lissa(url);
Lissa(url, options);
```

#### Returns

A Promise that resolves to a result object or rejects into a result error.

### Create a Lissa instance - Lissa.create()
A Lissa instance can be created with base options that apply to or get merged into every request.

#### Syntax
```js
Lissa.create();
Lissa.create(baseURL);
Lissa.create(options);
Lissa.create(baseURL, options);
```

#### Returns

A new lissa instance.

### GET Request - Lissa.get() - lissa.get()

```js
lissa.get(url);
lissa.get(url, options);

// Can also be called as static method
Lissa.get()
```

### POST Request - Lissa.post() - lissa.post()

```js
lissa.post(url);
lissa.post(url, body);
lissa.post(url, body, options);

// Can also be called as static method
Lissa.post()
```

### PUT Request - Lissa.put() - lissa.put()

```js
lissa.put(url);
lissa.put(url, body);
lissa.put(url, body, options);

// Can also be called as static method
Lissa.put()
```

### PATCH Request - Lissa.patch() - lissa.patch()

```js
lissa.patch(url);
lissa.patch(url, body);
lissa.patch(url, body, options);

// Can also be called as static method
Lissa.patch()
```

### DELETE Request - Lissa.delete() - lissa.delete()

```js
lissa.delete(url);
lissa.delete(url, options);

// Can also be called as static method
Lissa.delete()
```

### General Request - Lissa.request() - lissa.request()

```js
lissa.request(options);

// Can also be called as static method
Lissa.request()
```

### Upload Files - Lissa.upload() - lissa.upload()
Upload files with optional progress tracking

#### Syntax
```js
lissa.upload(file, url);
lissa.upload(file, url, onProgress);
lissa.upload(file, url, onProgress, options);

// Can also be called as static method
Lissa.upload()
```

#### Example
```js
// Basic upload
await lissa.upload(file, "/upload");

// Upload with progress tracking
await lissa.upload(file, "/upload", (uploaded, total) => {
  console.log(`Upload progress: ${Math.round(uploaded / total * 100)} %`);
});
```

### Download Files - Lissa.download() - lissa.download()
Download files with optional progress tracking

#### Syntax
```js
lissa.download(url);
lissa.download(url, onProgress);
lissa.download(url, onProgress, options);

// Can also be called as static method
Lissa.download()
```

#### Example
```js
// Basic download
const { data: file } = await lissa.download("/file.pdf");

// Download with progress tracking
const { data: file } = await lissa.download("/file.pdf", (downloaded, total) => {
  console.log(`Download progress: ${Math.round(downloaded / total * 100)} %`);
});
```

### Register a plugin - lissa.use()
Easily add functionality with plugins like `Lissa.dedupe()` and `Lissa.retry()`

```js
lissa.use(plugin);
```

### Before Request Hook - lissa.beforeRequest()
Modify options before a request is processed. Returning a new options object is also possible, keep in mind a new options object will not get merged with defaults again.

```js
lissa.beforeRequest((options) => {
  options.headers.set("X-Timestamp", Date.now());
});
```

### Before Fetch Hook - lissa.beforeFetch()
Modify the final fetch arguments for special edge cases. Returning a new object is also possible.

```js
lissa.beforeFetch(({ url, options }) => {
  console.log("Calling fetch(url, options)", { url, options });
});
```

### Response Hook - lissa.onResponse()
Handle successful responses. If a value gets returned in this hook, every hook registered after this hook getting skipped and the request promise fulfills with this return value. If an error gets thrown or returned the request promise rejects with this error.

```js
lissa.onResponse((result) => {
  console.log("Response received:", result.status);
});
```

### Error Hook - lissa.onError()
Handle connection, response or abort errors. If a value gets returned in this hook, every hook registered after this hook getting skipped and the request promise fulfills with this return value. If an error gets thrown or returned the request promise rejects with this error.

```js
lissa.onError((error) => {
  if (error.name === "ResponseError" && error.status === 401) {
    redirectToLogin();
  }
});
```

### Extend an Instance - lissa.extend()
Creates a new instance with merged options

```js
const apiClient = lissa.extend({
  headers: { "Authorization": "Bearer token" }
});
```

### Authentication - lissa.authenticate()
Creates a new instance with added basic authentication

```js
const authenticatedClient = lissa.authenticate("username", "password");
```

## Fluent API

The promises returned by the requests aren't just promises. They are instances of the LissaRequest class which allows a fluent API syntax. An instance of LissaRequest is referenced as `request`.

### Set the base URL - request.baseURL()

```js
await lissa.get("/data").baseURL("https://api2.example.com");
```

### Set the request URL - request.url()

```js
await lissa.request(options).url("/data2");
```

### Set the HTTP method - request.method()

```js
await lissa.get("/data").method("delete");  // :D
```

### Add or override request headers - request.headers()

```js
await lissa.get("/data").headers({ "X-Foo": "bar" });
```

### Set basic authentication - request.authenticate()

```js
await lissa.get("/data").authenticate("username", "password");
```

### Add or override query string parameters - request.params()

```js
await lissa.get("/data").params({ foo: "bar" });
```

### Attach or merge request body - request.body()

```js
await lissa.post("/data").body({ foo: "bar" });
```

### Set a request timeout in milliseconds - request.timeout()
Attaches an AbortSignal.timeout(...) signal to the request

```js
await lissa.get("/data").timeout(30 * 1000);
```

### Attach an AbortSignal - request.signal()
Attaches an AbortSignal to the request

```js
await lissa.get("/data").signal(abortController.signal);
```

### Change the expected response type - request.responseType()
By default every response gets parsed as json

```js
await lissa.get("/plain-text").responseType("text");
```

### Access the options directly - request.options
For special edge cases you can access the options directly

```js
const request = lissa.get("/data");
request.options.headers.delete("X-Foo");
const result = await request;
```

### Other
A LissaRequest provides some other maybe useful properties and events for more special edge cases.

```js
const request = lissa.get("/data");

request.status; // "pending", "fulfilled" or "rejected"
request.value; // The result object if promise fulfills
request.reason; // The result error if promise rejects

request.on("resolve", (value) => console.log(value));
request.on("reject", (reason) => console.log(reason));
request.on("settle", ({ status, value, reason }) => console.log({ status, value, reason }));

const result = await request;
```


## Built-in Plugins

### Retry Plugin - Lissa.retry()
Automatically retry failed requests. The retry delay is 1 sec on first retry, 2 sec on second retry, etc., but max 5 sec. The default options are different for browsers and node. It is most likely that we want to connect to our own service in a browser and to vendor services in node. The node default is 3 retries on every error type. The browser default is Infinity for all error types except for server errors which is 0 (no retries).

```js
lissa.use(Lissa.retry({
  onConnectionError: Infinity,
  onGatewayError: Infinity,
  on429: Infinity,
  onServerError: 0,
}));
```

#### shouldRetry Option
Decide if the occurred error should trigger a retry.

The given errorType helps preselecting error types. Return false to not
trigger a retry. Return nothing if the given errorType is correct. Return
a string to redefine the errorType or use a custom one. The number of
maximum retries can be configured as `on${errorType}`. Return "CustomError"
and define the retries as { onCustomError: 3 }

```js
Lissa.retry({
  onCustomError: 5,

  shouldRetry(errorType, error) {
    if (error.status === 999) return "CustomError";
    if (errorType === "429" && !error.headers.has("Retry-After")) return false;
    return errorType; // optional
  },
})
```

#### beforeRetry Option
Hook into the retry logic after the retry is triggered and before the delay
is awaited. Use beforeRetry e.g. if you want to change how long the delay
should be or to notify a customer that the connection is lost.

```js
Lissa.retry({
  // Return new object
  beforeRetry({ attempt, delay }, error) {
    if (error.status === 429) return { attempt, delay: delay * attempt };
  },

  // Or change existing object
  beforeRetry(retry, error) {
    if (error.status === 429) retry.delay = retry.attempt * 1234;
  },
})
```

#### onRetry Option
Hook into the retry logic after the delay is awaited and before the request
gets resent. Use onRetry e.g. if you want to log that a retry is running now

```js
Lissa.retry({
  onRetry({ attempt, delay }, error) {
    console.log("Retry attempt", attempt, "for", error.options.method, error.options.url);
  },
})
```

#### onSuccess Option
Hook into the retry logic after a request was successful. Use onSuccess
e.g. if you want to dismiss a connection lost notification

```js
Lissa.retry({
  onSuccess({ attempt, delay }, result) {
    console.log("Retry successful after attempt", attempt, "for", result.options.method, result.options.url, "-", result.status);
  },
})
```


### Dedupe Plugin - Lissa.dedupe()
Prevent duplicate requests by aborting leading or trailing identical requests. By default it only aborts leading get requests to the same endpoint ignoring query string params. Dedupe can be forced or disabled per request by adding dedupe to the request options setting the strategy or false.

```js
lissa.use(Lissa.dedupe({
  methods: ["get"], // Pre-filter by HTTP method
  getIdentifier: options => options.method + options.url, // Identify request
  defaultStrategy: "leading", // or trailing
}));

lissa.get("/data"); // Getting aborted on dedupe strategy "leading" (default)
lissa.get("/data"); // Getting aborted on dedupe strategy "trailing"

lissa.get("/data", { dedupe: false }); // Dedupe logic getting skipped

lissa.get("/data", { dedupe: "trailing" }); // Force dedupe with the given strategy
```

#### Dedupe by origin example

```js
lissa.use(Lissa.dedupe({
  // We use our own property to identify requests. A falsy identifier results in skipping dedupe logic
  getIdentifier: options => options.origin,

  // Abort trailing requests / Only the first request gets through
  defaultStrategy: "trailing",
}));

lissa.get("/todos", {
  origin: "todo_table_retry_btn",
  dedupe: "trailing", // Can be omitted - Already applied by defaultStrategy here
});

lissa.get("/todos", {
  origin: "todo_table_filter_input",
  dedupe: "leading", // Override defaultStrategy - abort previous requests

  // Example filter with params
  params: {
    search: "a search string",
    status: "done",
    orderBy: "created",
  },
});
```

## Error Types

Error types for different failure scenarios:

- **ResponseError**: HTTP errors (4xx, 5xx status codes)
- **TimeoutError**: Request timed out
- **AbortError**: Request got aborted
- **ConnectionError**: Network connectivity issues

All errors include the original request options. Response errors include response data and status information.

## Examples

### Query Parameters
```js
// Using params option
const { data } = await lissa.get("/posts", {
  params: { userId: 1, limit: 10 }
});

// Using fluent API
const { data } = await lissa.get("/posts").params({ userId: 1 });
```

### Request/Response Hooks
```js
// Add dynamic header to all requests
lissa.beforeRequest((options) => {
  options.headers.set("X-NOW", Date.now());
});

// Log all responses
lissa.onResponse(({ options, status }) => {
  console.log(`${options.method.toUpperCase()} ${options.url} - ${status}`);
});

// Handle errors globally
lissa.onError((error) => {
  if (error.status === 500) {
    Notify.error("An unexpected error occurred! Please try again later.");
  }
});
```

### File Upload with Progress
```js
const fileInput = document.querySelector("#file-input");
const file = fileInput.files[0];

await lissa.upload(file, "/upload", (uploaded, total) => {
  const percent = Math.round(uploaded / total * 100);
  console.log(`Upload progress: ${percent} %`);
  updateProgressBar(percent);
});
```

### Error Handling
```js
try {
  const { data } = await lissa.get("/data");
  console.log(data);
} catch (error) {
  if (error.name === "ResponseError") {
    console.error(`HTTP Error ${error.status}: ${error.data}`);
  } else if (error.name === "TimeoutError") {
    console.error("Request timed out");
  } else if (error.name === "AbortError") {
    console.error("Request got aborted");
  } else if (error.name === "ConnectionError") {
    console.error("Could not connect to target server");
  } else {
    console.error("Most likely a TypeError:", error);
  }
}
```

### Creating Multiple Clients
```js
// API client with authentication
const apiClient = Lissa.create({
  baseURL: "https://api.example.com",
  headers: {
    "Authorization": "Bearer token",
  }
});

// Public client without authentication
const publicClient = Lissa.create({
  baseURL: "https://public-api.example.com"
});

apiClient.use(Lissa.retry());
publicClient.use(Lissa.dedupe());
```

See the `examples/` directory for more usage examples, including browser-specific code and advanced plugin usage.

## Browser Support

Lissa works in all modern browsers that support the following APIs:

### Core Requirements
- **Fetch API** - For making HTTP requests
- **Promises** - For async operations
- **Headers API** - For request/response header manipulation
- **URL API** - For URL construction and parsing
- **AbortController/AbortSignal** - For request cancellation and timeouts
- **TextDecoderStream** - For body processing

### File Operations Requirements
- **File API** - For file handling, uploads and downloads with proper metadata
- **FormData API** - For multipart form uploads

### Progress Tracking Requirements (Optional)
- **TransformStream** - For download progress tracking with fetch

### Browser Compatibility
- **Chrome**: 124+ (full support)
- **Firefox**: 124+ (full support)
- **Safari**: 17.4+ (full support)
- **Edge**: 124+ (full support)

### Node.js Support

Requires Node.js 20.3+.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
