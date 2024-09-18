## Installation

### 1. Add module as a local dependency(_while we're still developing_)
```json
file: package.json

"dependencies": {
    "debugmate": "file:<place-here-you-clone-the-repo>"
}
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file in the root project if you don't have one and add the following variables
```.env
// file: .env

DEBUGMATE_DOMAIN=http://debugmate-app.test
DEBUGMATE_TOKEN=29b68285-5c46-42d0-86a8-19b0c6cd4324
DEBUGMATE_ENABLED=true
```
### 4. Add test script to `package.json`
```json
// file: package.json

"scripts": {
  "debugmate:test": "node ./node_modules/debugmate/scripts/connectionTest.js"
}
```

### 5. Run script test
You're able to send a fake error to the Debugmate as a test by running this command:
```bash
npm run debugmate:test
```

## Usage

### 1. Report Errors
In the class where you want report the error import the module and call the `debugmate.publish(error)` method
```js
const debugmate = require('debugmate/debugmate')

try {
    // ...error producing code
} catch (error) {
    debugmate.publish(error)
}
```

You can also report errors by calling `debugmate.publish(error)` method using `process.on('uncaughtException', (error) => {})`
```js
process.on('uncaughtException', (error) => {
    debugmate.publish(error)
})
```

### 2. Report Errors and Request Data
```js
//Some method that throws an error and has a request object
try {
    // ...error producing code
} catch (error) {
    debugmate.publish(error, request)
}
```
### 3. Report Context Data
If you want to send more information to the Debugmate:<br>
- Create `debugmateContext.cjs` file in the root project and create the getUser and getEnvironment methods. These methods will be called by the Debugmate to get the data you want to send.
- Add `DEBUGMATE_CONTEXT` to your .env file with the path of the appContext.js file.<br>

```js
// file: debugmateContext.cjs

function getUser() {
    // Retrieve user data the way you want
    const user = {
        id: 1,
        name: 'John Doe',
        email: 'johndoe@email.com',
    }

    // Return the user data as an object to Debugmate
    return user
}

function getEnvironment() {
    const environment = {
        environment: 'local',
        debug: true,
        timezone: 'UTC',
        server: 'apache',
        database: 'mysql 5.7',
        npm: '6.13.4',
    }

    return environment
}

module.exports = { getUser, getEnvironment }

```
```.env
// file: .env

DEBUGMATE_CONTEXT=/path/root/project/debugmateContext.cjs
```
