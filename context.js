/**
 * Represents the context of an application, including error, request, user, and environment information.
 */
class Context {
    constructor() {
        /**
         * @type {NodeJS.Process} The process information object.
         */
        this.processInfo = process;

        /**
         * @type {string} The operating system name.
         */
        this.operatingSystem = this.checkOperationSystem();
    }

    /**
     * Sets the error object in the context.
     * @param {Error} error - The error object to set.
     */
    setError(error) {
        this.error = error;
    }

    /**
     * Sets the request details in the context.
     * @param {Request} request - The request object to set.
     */
    setRequest(request) {
        this.request = request;
    }

    /**
     * Sets the user details in the context.
     * @param {User} user - The user object to set.
     * @throws {Error} If the user object is invalid.
     */
    setUser(user) {
        if (!user || typeof user.id !== 'number' || typeof user.name !== 'string') {
            throw new Error('Invalid user object');
        }
        this.user = user;
    }

    /**
     * Sets the environment details in the context.
     * @param {Environment} environment - The environment object to set.
     */
    setEnvironment(environment) {
        this.environment = environment;
    }

    /**
     * Determines the operating system name based on the process platform.
     * @returns {string} The operating system name.
     */
    checkOperationSystem() {
        const osMapping = {
            darwin: 'MacOS',
            win32: 'Windows',
            linux: 'Linux',
            android: 'Android',
        };
        return osMapping[this.processInfo.platform] || 'Unknown';
    }

    /**
     * Combines all context information (user, request, environment) into a single payload.
     * @returns {Object} The combined payload.
     */
    payload() {
        return {
            ...this.appUser(),
            ...this.appRequest(),
            ...this.appEnvironment(),
        };
    }

    /**
     * Gets the user information from the context.
     * @returns {Object} The user information or an empty object.
     */
    appUser() {
        return this.user ? { user: this.user } : {};
    }

    /**
     * Gets the request information from the context.
     * @returns {Object} The request details or default values if not set.
     */
    appRequest() {
        if (!this.request) {
            return {
                request: {
                    request: {
                        url: 'unknown',
                        method: 'GET',
                        params: {},
                    },
                    headers: {},
                    query_string: {},
                    body: '',
                },
            };
        }

        const url = this.request.url || 'unknown';
        const queryParams = this.getQueryParams();

        return {
            request: {
                request: {
                    url: url,
                    method: this.request.method || 'GET',
                    params: this.request.params || {},
                },
                headers: this.request.headers || {},
                query_string: queryParams,
                body: this.request.body || '',
            },
        };
    }

    /**
     * Parses and retrieves query parameters from the request URL.
     * @returns {Object} The query parameters as a key-value object.
     */
    getQueryParams() {
        if (!this.request?.url || !this.request?.headers?.host) {
            return {};
        }

        try {
            const urlObj = new URL(this.request.url, `http://${this.request.headers.host}`);
            const params = {};
            for (const [key, value] of urlObj.searchParams.entries()) {
                params[key] = value;
            }
            return params;
        } catch (err) {
            console.error('Error parsing query string:', err.message);
            return {};
        }
    }

    /**
     * Gets the environment details grouped into categories (Node, App, System).
     * @returns {Object} The environment details.
     */
    appEnvironment() {
        return {
            environment: this.filterKeys([
                this.nodeContext(),
                this.appEnvironmentVariables(),
                this.systemContext(),
            ]),
        };
    }

    /**
     * Retrieves Node.js context information.
     * @returns {Object} The Node.js context details.
     */
    nodeContext() {
        return this.processInfo.version
            ? { group: 'Node', variables: { version: this.processInfo.version } }
            : {};
    }

    /**
     * Retrieves application-specific environment variables.
     * @returns {Object} The app environment variables grouped under "App".
     */
    appEnvironmentVariables() {
        const vars = {};
        this.addIfDefined(vars, 'environment', this.environment?.environment);
        this.addIfDefined(vars, 'debug', this.environment?.debug);
        this.addIfDefined(vars, 'timezone', this.environment?.timezone);

        return Object.keys(vars).length ? { group: 'App', variables: vars } : {};
    }

    /**
     * Retrieves system-related context information.
     * @returns {Object} The system context details grouped under "System".
     */
    systemContext() {
        const vars = {
            os: this.operatingSystem,
            server: this.environment?.server,
            database: this.environment?.database,
            npm: this.environment?.npm,
            browser: this.request?.headers?.['user-agent'],
        };

        return { group: 'System', variables: vars };
    }

    /**
     * Adds a key-value pair to an object if the value is defined.
     * @param {Object} target - The target object to modify.
     * @param {string} key - The key to add.
     * @param {*} value - The value to add.
     */
    addIfDefined(target, key, value) {
        if (value !== undefined) {
            target[key] = value;
        }
    }

    /**
     * Filters out objects from an array that have no keys.
     * @param {Array<Object>} array - The array of objects to filter.
     * @returns {Array<Object>} The filtered array.
     */
    filterKeys(array) {
        return array.filter((item) => Object.keys(item).length > 0);
    }
}

module.exports.Context = Context;