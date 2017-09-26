const net = require('..')

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
