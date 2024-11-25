const http = require('http');
const https = require('https');
const { Context } = require('./context');
const fs = require('fs');

class Debugmate {
    static instance = null;

    constructor(options = {}) {
        if (!Debugmate.instance) {
            this.domain = options.domain;
            this.token = options.token;
            this.enabled = options.enabled !== undefined ? options.enabled : true;
            this.context = new Context();

            Debugmate.instance = this;
        }

        return Debugmate.instance;
    }

    setUser(user) {
        this.context.setUser(user);
    }

    setEnvironment(environment) {
        this.context.setEnvironment(environment);
    }

    setRequest(request) {
        this.context.setRequest(request);
    }

    setupGlobalErrorHandling() {

        process.on('uncaughtException', (error) => {
            this.publish(error);
        });

        process.on('unhandledRejection', (reason) => {
            const error =
                reason instanceof Error
                    ? reason
                    : new Error(`Unhandled rejection: ${JSON.stringify(reason)}`);

            this.publish(error);
        });

    }

    publish(error, userContext = null, environmentContext = null, request = null) {
        try {
            if (!this.isPublishingAllowed(error)) return;

            if (userContext) {
                this.setUser(userContext);
            }

            if (environmentContext) {
                this.setEnvironment(environmentContext);
            }

            if (request) {
                this.setRequest(request);
            }

            const requestPayload = this.context.appRequest();
            const data = this.payload(error, requestPayload);

            const protocol = this.domain.startsWith('http://') ? http : https;
            const options = {
                method: 'POST',
                headers: {
                    'X-DEBUGMATE-TOKEN': this.token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            };

            const req = protocol.request(`${this.domain}/api/capture`, options, (res) => {
                if (error.message === 'Test generated by the Debugmate test command') {
                    this.handleScriptResponse(res);
                }
                res.on('data', () => { });
                res.on('end', () => { });
            });

            req.on('error', (err) => console.error('Debugmate error:', err.message));
            req.write(JSON.stringify(data));
            req.end();
        } catch (err) {
            console.error('Unexpected error in Debugmate publish:', err.message);
        }
    }

    isPublishingAllowed(error) {
        if (!error || this.enabled === false || !this.domain || !this.token) {
            console.warn('Error not published to Debugmate. Check configuration or the error.');
            return false;
        }
        return true;
    }

    payload(error, context) {
        const trace = this.trace(error);

        return {
            exception: error.name,
            message: error.message,
            file: trace[0]?.file || 'unknown',
            type: 'web',
            trace,
            ...this.context.payload(),
        };
    }


    trace(error) {
        const stackTrace = require('./stackTraceParser').parse(error);
    
        if (!stackTrace.sources || stackTrace.sources.length === 0) {
            return [];
        }
    
        const ignoredPatterns = [
            '/debugmate.js',
            '/node_modules/',
            'node:internal',
        ];
    
        return stackTrace.sources
            .filter((source) => {
                if (!source.file) return true;
                return !ignoredPatterns.some((pattern) => source.file.includes(pattern));
            })
            .map((source) => {
                let codePreview = {};
                let errorLine = source.line || null;
    
                if (!source.file || source.file.startsWith('node:internal')) {
                    codePreview = { "1": "(Internal Node.js file - no preview available)" };
                } else if (source.file && errorLine) {
                    try {
                        const fileContent = fs.readFileSync(source.file, 'utf-8');
                        const lines = fileContent.split('\n');
    
                        const startLine = Math.max(0, errorLine - 5);
                        const endLine = Math.min(lines.length, errorLine + 5);
    
                        for (let i = startLine; i <= endLine; i++) {
                            codePreview[i + 1] = lines[i] || null;
                        }
                    } catch (err) {
                        codePreview = { "1": `(Unable to read file "${source.file}" - ${err.message})` };
                    }
                } else {
                    codePreview = { "1": "(No file or line information available)" };
                }
    
                return {
                    file: source.file,
                    line: source.line,
                    column: source.column,
                    function: source.function,
                    class: source.file,
                    preview: codePreview,
                };
            });
    }

}

module.exports = Debugmate;