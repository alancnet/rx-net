const assert = require('assert')
const net = require('../net')
const nodeNet = require('net')
const { Observable } = require('rxjs')

describe('server', () => {
    it('should accept connections', (done) => {
        const sub = net.server('127.0.0.1', 51771, err => {
            if (err) done(err)
            const client = nodeNet.connect(51771, 'localhost', () => {
                client.unref()
            }).once('error', done)
        }).subscribe(session => {
            sub.unsubscribe()
            done()
        })
    })
    it('should receive data', (done) => {
        const sub = net.server('127.0.0.1', 51771, err => {
            if (err) done(err)
            const client = nodeNet.connect(51771, 'localhost', () => {
                client.write('hello world')
            }).once('error', done)
        }).subscribe(session => {
            session.inputStream.subscribe(x => {
                if (x.toString() === 'hello world') {
                    sub.unsubscribe()
                    done()
                }
            })
        })
    })
    it('should send data', (done) => {
        const sub = net.server('127.0.0.1', 51771, err => {
            if (err) done(err)
            const client = nodeNet.connect(51771, 'localhost', () => {
                client.on('data', data => {
                    if (data.toString() === 'hello world') {
                        sub.unsubscribe()
                        done()
                    }
                })
            }).once('error', done)
        }).subscribe(session => {
            session.send('hello world')
        })
    })
    it('should disconnect clients when error is emitted', (done) => {
        const sub = net.server('127.0.0.1', 51771, err => {
            if (err) done(err)
            const client = nodeNet.connect(51771, 'localhost', () => {
                client.on('close', () => {
                    sub.unsubscribe()
                    done()
                })
            }).once('error', done)
        }).subscribe(session => {
            session.send(Observable.throw(new Error('FINDME')))
        })
    })
    it('should disconnect clients when input is complete', (done) => {
        const sub = net.server('127.0.0.1', 51771, err => {
            if (err) done(err)
            const client = nodeNet.connect(51771, 'localhost', () => {
                client.on('close', () => {
                    sub.unsubscribe()
                    done()
                })
            }).once('error', done)
        }).subscribe(session => {
            session.close()
        })
    })
    it('should complete the input stream when client disconnects', (done) => {
        const sub = net.server('127.0.0.1', 51771, err => {
            if (err) done(err)
            const client = nodeNet.connect(51771, 'localhost', () => {
                client.end()
            }).once('error', done)
        }).subscribe(session => {
            session.inputStream.subscribe(null, null, () => {
                sub.unsubscribe()
                done()
            })
        })
    })
})

describe('client', () => {
    it('should callback when connection succeeds', (done) => {
        const sub = net.server('127.0.0.1', 51771, () => {
            const client = net.client('localhost', 51771, () => {
                client.close()
                sub.unsubscribe()
                done()
            })
        }).subscribe()
    })
    it('should emit an error on inputStream when it cannot connect', (done) => {
        net.client('localhost', 51771).inputStream
            .subscribe(null, err => {
                done()
            }, null)
    })
    it('should send data to the server', (done) => {
        const sub = net.server('127.0.0.1', 51771, () => {
            const client = net.client('localhost', 51771, () => {
                client.send('hello world')
            })
        }).subscribe(session => {
            session.inputStream.subscribe((x) => {
                if (x.toString() === 'hello world') {
                    sub.unsubscribe()
                    done()
                }
            })
        })
    })
    it('should receive data from the server', (done) => {
        const sub = net.server('127.0.0.1', 51771, () => {
            const client = net.client('localhost', 51771)
            client.inputStream.subscribe((x) => {
                    if (x.toString() === 'hello world') {
                        sub.unsubscribe()
                        client.close()
                        done()
                    }
                })
        }).subscribe(session => {
            session.send('hello world')
        })
    })
    it('should disconnect when error is emitted', (done) => {
        const sub = net.server('127.0.0.1', 51771, () => {
            const client = net.client('localhost', 51771, () => {
                client.send(Observable.throw(new Error('FINDME')))
            })
        }).subscribe(session => {
            session.inputStream.subscribe(null, null, () => {
                sub.unsubscribe()
                done()
            })
        })
    })
    it('should complete the input stream when the server disconnects', (done) => {
        const sub = net.server('127.0.0.1', 51771, () => {
            const client = net.client('localhost', 51771)
            client.inputStream.subscribe(null, null, () => {
                    sub.unsubscribe()
                    client.close()
                    done()
                })
        }).subscribe(session => {
            session.close()
        })
    })

})
