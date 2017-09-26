const net = require('net')
const { Observable, Subject } = require('rxjs')

/**
    @param {InetSocketAddress} local
    @returns {Observable<Session>}
*/
const server = (address, port, onListen) => Observable.create(observer => {
    const server = net.createServer(c => {
        const newSession = session(c)

        newSession.outputStream.subscribe(
            (data) => c.write(data),
            (err) => {
                console.warn(err.message)
                c.end()
                newSession.close()
            },
            () => {
                c.end()
                newSession.close()
            }
        )
        observer.next(newSession)
    })
    server.on('error', err => {
        if (onListen) onListen(err)
        observer.error(err)
    })
    server.listen(port, address, () => {
        if (onListen) onListen(null, server)
    })

    return () => server.close()
})

/**
    @param {Socket} socket
    @prop {Observable<Buffer>} inputStream
    @prop {Observable<Buffer>} outputStream
*/
const session = (socket) => {
    const input = new Subject()
    const inputStream = input.asObservable()
    const output = new Subject()
    const outputStream = output.asObservable()

    const send = o =>
        o.subscribe ? o.subscribe(x => output.next(x), e => output.error(e), () => {})
        : Array.isArray(o) ? send(Observable.from(o))
        : send(Observable.of(o))

    socket.on('error', err => input.error(err))
    socket.on('data', data => input.next(data))
    socket.on('end', () => input.complete())
    socket.on('close', () => input.complete())
    const close = () => {
        output.complete()
    }

    return {inputStream, outputStream, send, close}
}

const client = (address, port, onConnect) => {
    const socket = net.createConnection(port, address, () => {
        if (onConnect) onConnect(newSession)
    })
    const newSession = session(socket)

    newSession.outputStream.subscribe(
        (data) => socket.write(data),
        (err) => {
            console.warn(err.message)
            socket.end()
            newSession.close()
        },
        () => {
            socket.end()
            newSession.close()
        }
    )

    return newSession
}

module.exports = {server, client, session}
