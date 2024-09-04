process.env.COCKPIT_DOMAIN = 'http://cockpit-app.test'
process.env.COCKPIT_TOKEN = 'token'
process.env.COCKPIT_ENABLED = true

const { Context } = require('../context')
const cockpit = require('../cockpit')
const queryString = require('querystring')
const appContext = require('./appContext')

test('it should be able to send error', () => {
    error = new Error('This is an error')

    cockpit.publish(error)

    let payload = cockpit.payload(error)

    expect(payload.message).toEqual(error.message)
})

test('it should be able to send error and request', () => {
    error = new Error('This is an error')

    request = {
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
        body: ''
    }

    let context = new Context().setRequest(request)

    cockpit.publish(error, request)

    let payload = cockpit.payload(error, context)

    expect(payload.message).toEqual(error.message)

    expect(payload.request.request.url).toEqual(request.url)
})

test('it should be able to send context', () => {
    error = new Error('This is an error')

    let context = new Context()
        .setError(error)
        .setUser({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@email.com'
        })
        .setEnvironment({
            environment: 'local',
            debug: 'true',
            timezone: process.env.TZ = 'UTC',
            server: 'nginx',
            database: 'mysql 5.7',
            npm: '9.5.0'
        })
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
            body: ''
        })
        .setProcess({
            platform: 'darwin',
            version: 'v18.14.2'
        })

    cockpit.publish(error)

    let payload = cockpit.payload(error, context)

    expect(payload.message).toEqual(error.message)

    expect(payload.user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'johndoe@email.com'
    })

    expect(payload.environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}},
        {
            group: 'App',
            variables: {environment: 'local', debug: 'true', timezone: 'UTC'}
        },
        {
            group: 'System',
            variables: {
                os: 'MacOS',
                server: 'nginx',
                database: 'mysql 5.7',
                npm: '9.5.0'
            }
        }
    ])

    expect(payload.request).toEqual({
        request: {
            url: '/api/v1/users',
            method: 'GET',
            params: {
                "id": "3"
            }
        },
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "host": "localhost:8000"
        },
        query_string: queryString.parse("select * from users where id = 3"),
        body: ''
    })
})

test('it should be able to set appContext', () => {
    error = new Error('This is an error')

    let context = new Context()
        .setError(error)
        .setUser(appContext.getUser())
        .setEnvironment(appContext.getEnvironment())
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
            body: ''
        })
        .setProcess({
            platform: 'darwin',
            version: 'v18.14.2'
        })

    cockpit.publish(error)

    let payload = cockpit.payload(error, context)

    expect(payload.message).toEqual(error.message)

    expect(payload.user).toEqual({
        id: 1,
        name: 'John test',
        email: 'johndoe@email.com'
    })

    expect(payload.environment).toEqual([
        {
            group: 'Node',
            variables: {version: 'v18.14.2'}},
        {
            group: 'App',
            variables: {environment: 'local', debug: true, timezone: 'UTC'}
        },
        {
            group: 'System',
            variables: {
                os: 'MacOS',
                server: 'apache',
                database: 'mysql 5.7',
                npm: '6.13.4'
            }
        }
    ])

    expect(payload.request).toEqual({
        request: {
            url: '/api/v1/users',
            method: 'GET',
            params: {
                "id": "3"
            }
        },
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "host": "localhost:8000"
        },
        query_string: queryString.parse("select * from users where id = 3"),
        body: ''
    })
})
