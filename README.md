# DebugMate Node.js

DebugMate is an error tracking and monitoring tool designed for Node.js applications. This package allows you to capture and send error reports along with environment, user, and request context information to a remote API.

#### Singleton Design Pattern

The DebugMate constructor uses the Singleton pattern, ensuring that only one instance of DebugMate is created during the application’s lifecycle. Subsequent calls to the constructor return the same instance, keeping error reporting consistent throughout the application.

If you need to reset or reinitialize DebugMate, you can manually reset the singleton instance like this:

```js
// Reset the instance by setting it to null
Debugmate.instance = null;

// Create a new instance
const newDebugmate = new Debugmate({
  domain: "https://your-new-domain.com",
  token: "new-api-token",
  enabled: true,
});
```

## Installation


To install DebugMate for Node.js, you can add it as a local dependency while in development:
```json
file: package.json

"dependencies": {
    "debugmate": "file:<place-here-you-clone-the-repo>"
}
```

Then install the package:
```bash
npm install
```
## Usage
### Basic Setup
To get started with DebugMate, initialize it with your API domain and token. This allows DebugMate to send error reports to your server.

```js
const Debugmate = require('debugmate');

const debugmate = new Debugmate({
  domain: "https://your-domain.com",
  token: "your-api-token",
  enabled: true, // Enable or disable error reporting
});
```

### Set User Context
You can attach user information to the error reports to gain more insight into which user experienced the error.

```js
const user = {
  id: 123,
  name: "John Doe",
  email: "john@example.com",
};

debugmate.setUser(user);
```

### Set Environment Context
You can set the environment context, including details about the application, server, and metadata.

```js
const environment = {
  environment: "production", // 'development', 'staging', 'production', etc.
  debug: false,
  timezone: "UTC",
  server: "nginx",
  database: "mysql",
  npm: "6.14.8",
};

debugmate.setEnvironment(environment);
```

### Set Request Context
To include information about an HTTP request (e.g., during a REST API operation), pass the request object to DebugMate.

```js
const request = {
  request: {
    url: "https://your-api.com/endpoint",
    method: "POST",
    params: { key: "value" },
  },
  headers: {
    Authorization: "Bearer token",
    "Content-Type": "application/json",
  },
  query_string: { search: "query" },
  body: JSON.stringify({ data: "payload" }),
};

debugmate.setRequest(request);
```

### Publish errors
To manually send an error report, use the publish method. You can include optional contexts like user, environment, and request:
```js
try {
  // Simulate code that throws an error
  throw new Error("Something went wrong!");
} catch (error) {
  debugmate.publish(error, user, environment, request);
}
```

### Automatic Error Handling
You can set up global error handling for uncaught exceptions and unhandled promise rejections:

```js
process.on('uncaughtException', (error) => {
  debugmate.publish(error);
});

process.on('unhandledRejection', (reason) => {
  debugmate.publish(reason);
});
```


## API Reference

### DebugMate Constructor

- **domain:** The API endpoint to which errors are sent (required).

- **token:** The API token used for authentication (required).

- **enabled:** Boolean flag to enable or disable error reporting (optional, default: true).

### Methods

- **setUser(user):** Attach user information to the error report.

- **setEnvironment(environment):** Set environment metadata such as app version, server info, etc.

- **setRequest(request):** Attach details about the current HTTP request to the error report.

- **publish(error, userContext = null, environmentContext = null, requestContext = null):** Send an error report to the API.


## Example Server with DebugMate
Here’s how you can integrate DebugMate into a Node.js HTTP server:

```js
const http = require('http');
const Debugmate = require('debugmate');

const debugmate = new Debugmate({
  domain: 'https://your-debugmate-domain.com',
  token: 'your-api-token',
  enabled: true,
});

const server = http.createServer((req, res) => {
  let body = [];

  req.on('data', (chunk) => body.push(chunk));
  req.on('end', () => {
    body = Buffer.concat(body).toString();

    // Set request data in Debugmate
    debugmate.setRequest({
      url: req.url,
      method: req.method,
      headers: req.headers,
      params: {}, // Parse query params if needed
      body: body,
    });

    try {
      if (req.url === '/error') {
        throw new Error('Simulated error');
      }
      res.statusCode = 200;
      res.end('Hello, World!');
    } catch (error) {
      debugmate.publish(error); // Publish error with request data
      res.statusCode = 500;
      res.end('Error captured and published!');
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000/');
});
```

## Testing DebugMate Integration
To verify DebugMate is working, you can run a test script included in the package:

### 1. Add the test script to package.json:

```js
"scripts": {
  "debugmate:test": "node ./node_modules/debugmate/scripts/connectionTest.js"
}
```

### 2. Run the test:

```bash
npm run debugmate:test
```