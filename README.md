# rx-net

Common net operations using Reactive Extensions.

## server

Listens on a host and port, returning a stream of sessions. Unsubscribing will stop listening.

Optionally calls a callback when server begins listening.

### Usage:

```javascript
server(<host?>, <port>, <onListen?>)
    .subscribe(
        session => { ... },
        error => { ... }
    )
```

## client

Connects to a host and port, returning a session.

Optionally calls a callback when connection succeeds.

### Usage:

```javascript
const session = client(<host>, <port>, <onConnect?>)
```

## session

Whether emitted by a server stream, or created by calling client, the session object handles communication back and forth to the peer.

### outputStream: `Observable<Buffer>`

This is the stream of messages being sent by your code. You do not need to directly interact with this stream.

### inputStream: `Observable<Buffer>`

Stream of incoming packets from the peer.

### send(data)

Sends data to the peer. Can pass a `Buffer`, `Array<Buffer>`, or `Observable<Buffer>`.

### close()

Ends the connection with the peer.

## Full sample

```javascript
const net = require('rx-rpc')

const hodor = session => {
    session.inputStream.subscribe(data => {
        const text = data.toString()
        if (text.startsWith('hodor')) {
            const i = parseInt(text.substr(5))
            if (i === 100) {
                session.close()
            } else {
                session.send(`hodor ${i + 1}`)
            }
        }
    })
    session.send('hodor 1')
}
const startServer = () => {
    const subscription = net.server('0.0.0.0', 1234, startClient)
        .subscribe(
            session => {
                hodor(session)
                subscription.unsubscribe()
            },
            err => {
                console.error(err)
            }
        )
}
const startClient = () => {
    net.client('0.0.0.0', 1234, hodor)
}
startServer()
```
