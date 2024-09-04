const { Context } = require('../context')
const queryString = require('querystring')

const error = new Error('This is an error')

test ('it should be able to set the user', () => {
    let context = new Context()
        .setUser({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@email.com'
        })

    expect(context.user).toEqual({ id: 1, name: 'John Doe', email: 'johndoe@email.com' })
})

test ('it should be able to set the environment', () => {
    let context = new Context()
        .setEnvironment({
            environment: 'local',
            debug: true,
            timezone: 'UTC',
            server: 'apache',
            database: 'mysql 5.7',
            npm: '6.13.4',
        })

    expect(context.environment).toEqual({
        environment: 'local',
        debug: true,
        timezone: 'UTC',
        server: 'apache',
        database: 'mysql 5.7',
        npm: '6.13.4',
    })
})

test ('it should be able to set the request', () => {
    let context = new Context()
        .setRequest({
            url: '/api/v1/users',
            method: 'GET',
            params: {
                "id": "3"
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "host": "localhost:8000"
            },
            query: "select * from users where id = 3",
        })

    expect(context.request).toEqual({
        url: '/api/v1/users',
        method: 'GET',
        params: {
            "id": "3"
          },
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "host": "localhost:8000"
        },
        query: "select * from users where id = 3",
    })
})

test ('it should be able to define the url with baseUrl in the request', () => {
    let context = new Context()
        .setError(error)
        .setRequest({
            baseUrl: '/api/v1/users',
        })

    expect(context.payload().request.request.url).toEqual('/api/v1/users')
})

test ('it should be able to define the url with url in the request', () => {
    let context = new Context()
        .setError(error)
        .setRequest({
                url: '/api/v1/users',
            })

    expect(context.payload().request.request.url).toEqual('/api/v1/users')
})

test ('it should be able to define the query when error has sql', () => {
    const errorWithSql = Object.assign(error, { sql: 'select * from users where id = 3' })

    let context = new Context()
        .setError(errorWithSql)
        .setRequest({
                url: '/api/v1/users',
            })

    expect(context.payload().request.query_string).toEqual(queryString.parse("select * from users where id = 3"))
})

test ('it should be able to define the query without error in the request', () => {
    let context = new Context()
        .setError(error)
        .setRequest({
                query: "select * from users where id = 3",
            })

    expect(context.payload().request.query_string).toEqual(queryString.parse("select * from users where id = 3"))
})

test ('it should be able to define the body if it is in the request', () => {
    let context = new Context()
        .setError(error)
        .setRequest({
                body: {
                    "name": "John Doe",
                    "email": "johndoe@email.com",
                }
            })

    expect(context.payload().request.body).toEqual({"name": "John Doe", "email": "johndoe@email.com"})
})

test ('it should be able to define the body as empty if it is not in the request', () => {
    let context = new Context()
        .setError(error)
        .setRequest({
            url: '/api/v1/users',
        })

    expect(context.payload().request.body).toEqual('')
})

test ('it should be able to define the node version without pass it in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            debug: true,
        })
        .setProcess({
            version: 'v18.14.2',
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'App',
            variables: {debug: true}
        },
        {
            group: 'System',
            variables: {os: 'Unknown'}
        }
    ])
})

test ('it should be able to define the app environment in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            environment: 'local',
        })
        .setProcess({
            version: 'v18.14.2'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'App',
            variables: {environment: 'local'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown'}
        }
    ])
})

test ('it should be able to define the app debug in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            debug: true,
        })
        .setProcess({
            version: 'v18.14.2'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'App',
            variables: {debug: true}
        },
        {
            group: 'System',
            variables: {os: 'Unknown'}
        }
    ])
})

test ('it should be able to define the app timezone in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            timezone: process.env.TZ = 'UTC',
        })
        .setProcess({
            version: 'v18.14.2'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'App',
            variables: {timezone: process.env.TZ = 'UTC'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown'}
        }
    ])
})

test ('it should be able to define the system OS without pass it in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            timezone: 'UTC',
        })
        .setProcess({
            version: 'v18.14.2',
            platform: 'centOS'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'App',
            variables: {timezone: 'UTC'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown'}
        }
    ])
})

test ('it should be able to define the server in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            server: 'nginx/1.23.3',
        })
        .setProcess({
            version: 'v18.14.2',
            platform: 'centOS'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown', server: 'nginx/1.23.3'}
        }
    ])
})

test ('it should be able to define the database in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            database: 'mysql 10.11.2',
        })
        .setProcess({
            version: 'v18.14.2',
            platform: 'centOS'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown', database: 'mysql 10.11.2'}
        }
    ])
})

test ('it should be able to define the browser version without pass it in the context environment', () => {
    let context = new Context()
        .setError(error)
        .setEnvironment({
            environment: 'local',
        })
        .setRequest({
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "host": "localhost:8000",
                "user-agent": "Chrome/111.0.5563.64",
            },
        })
        .setProcess({
            version: 'v18.14.2',
            platform: 'centOS'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'App',
            variables: {environment: 'local'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown', browser: 'Chrome/111.0.5563.64'}
        }
    ])
})

test ('it should be able to define the browser version as empty if do not have request in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            npm: '5.8.2',
        })
        .setProcess({
            version: 'v18.14.2',
            platform: 'centOS'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown', npm: '5.8.2'}
        }
    ])
})

test ('it should be able to define the npm version in the context environment', () => {
    let context = new Context()
        .setEnvironment({
            npm: '5.8.2',
        })
        .setProcess({
            version: 'v18.14.2',
            platform: 'centOS'
        })

    expect(context.payload().environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}
        },
        {
            group: 'System',
            variables: {os: 'Unknown', npm: '5.8.2'}
        }
    ])
})
