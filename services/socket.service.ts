import { Server as SocketIOServer } from 'socket.io'
import WebSocket from 'ws'
import http from 'http'
import { logger } from './logger.service.js'

const CLOB_WSS = 'wss://ws-subscriptions-clob.polymarket.com/ws/market'
const RTDS_WSS = 'wss://ws-live-data.polymarket.com'

let io: SocketIOServer
let clobWs: WebSocket | null = null
let rtdsWs: WebSocket | null = null
let rtdsPingInterval: ReturnType<typeof setInterval> | null = null

// כמה socket.io clients מנויים לכל assetId — כדי לדעת מתי לא צריך יותר
const assetSubscribers = new Map<string, number>()

// ─── CLOB WebSocket — מחירים ו-orderbook ─────────────────────────────────

function connectClobWs() {
    if (clobWs?.readyState === WebSocket.OPEN) return

    clobWs = new WebSocket(CLOB_WSS)

    clobWs.on('open', () => {
        logger.info('[CLOB-WS] Connected')
        const assets = Array.from(assetSubscribers.keys())
        if (assets.length > 0) sendClobSubscription(assets)
    })

    clobWs.on('message', (raw) => {
        try {
            const msgs = JSON.parse(raw.toString())
            const arr: any[] = Array.isArray(msgs) ? msgs : [msgs]

            arr.forEach((msg) => {
                if (!msg.asset_id) return
                const room = `market:${msg.asset_id}`

                switch (msg.event_type) {
                    case 'price_change':
                        io.to(room).emit('market:price_update', {
                            assetId: msg.asset_id,
                            price: msg.price,      // string "0.72" — בין 0 ל-1
                            side: msg.side,
                            timestamp: msg.timestamp,
                        })
                        break

                    case 'book':
                        io.to(room).emit('market:orderbook', {
                            assetId: msg.asset_id,
                            bids: msg.bids ?? [],
                            asks: msg.asks ?? [],
                        })
                        break
                }
            })
        } catch (err) {
            logger.error('[CLOB-WS] Parse error', err)
        }
    })

    clobWs.on('close', () => {
        logger.warn('[CLOB-WS] Disconnected — reconnecting in 3s')
        clobWs = null
        setTimeout(connectClobWs, 3000)
    })

    clobWs.on('error', (err) => logger.error('[CLOB-WS] Error', err))
}

function sendClobSubscription(assetIds: string[]) {
    if (clobWs?.readyState !== WebSocket.OPEN) {
        connectClobWs()
        return
    }
    clobWs.send(JSON.stringify({ assets_ids: assetIds, type: 'Market' }))
    logger.info(`[CLOB-WS] Subscribed to assets: ${assetIds.join(', ')}`)
}

// ─── RTDS WebSocket — comments ────────────────────────────────────────────

function connectRtdsWs() {
    if (rtdsWs?.readyState === WebSocket.OPEN) return

    rtdsWs = new WebSocket(RTDS_WSS)

    rtdsWs.on('open', () => {
        logger.info('[RTDS-WS] Connected')
        rtdsWs!.send(JSON.stringify({
            action: 'subscribe',
            subscriptions: [{ topic: 'comments', type: 'comment_created' }],
        }))
        // חובה לפי הדוקס של Polymarket
        rtdsPingInterval = setInterval(() => {
            if (rtdsWs?.readyState === WebSocket.OPEN) rtdsWs.send('PING')
        }, 5000)
    })

    rtdsWs.on('message', (raw) => {
        const str = raw.toString()
        if (str === 'PONG') return
        try {
            const msg = JSON.parse(str)
            if (msg.topic === 'comments' && msg.type === 'comment_created') {
                const eventId: string | undefined = msg.payload?.parent_entity_id
                if (eventId) {
                    io.to(`event:${eventId}`).emit('event:new_comment', msg.payload)
                }
            }
        } catch (err) {
            logger.error('[RTDS-WS] Parse error', err)
        }
    })

    rtdsWs.on('close', () => {
        if (rtdsPingInterval) clearInterval(rtdsPingInterval)
        logger.warn('[RTDS-WS] Disconnected — reconnecting in 3s')
        rtdsWs = null
        setTimeout(connectRtdsWs, 3000)
    })

    rtdsWs.on('error', (err) => logger.error('[RTDS-WS] Error', err))
}

// ─── Socket.IO setup ──────────────────────────────────────────────────────

export function setupSocketIO(server: http.Server) {
    io = new SocketIOServer(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'http://localhost:5173',
                'http://127.0.0.1:5173',
            ],
            credentials: true,
        },
    })

    // RTDS תמיד פעיל — מאזין ל-comments מכל event
    connectRtdsWs()

    io.on('connection', (socket) => {
        logger.info(`[Socket.IO] Client connected: ${socket.id}`)

        // קליינט נכנס לדף event ספציפי
        socket.on('subscribe:event', (eventId: string) => {
            if (!eventId) return
            socket.join(`event:${eventId}`)
        })

        socket.on('unsubscribe:event', (eventId: string) => {
            socket.leave(`event:${eventId}`)
        })

        // קליינט רוצה עדכוני מחיר של asset ספציפי (clobTokenId)
        socket.on('subscribe:market', (assetId: string) => {
            if (!assetId) return
            socket.join(`market:${assetId}`)
            const count = (assetSubscribers.get(assetId) ?? 0) + 1
            assetSubscribers.set(assetId, count)
            sendClobSubscription([assetId])
        })

        socket.on('unsubscribe:market', (assetId: string) => {
            socket.leave(`market:${assetId}`)
            const count = (assetSubscribers.get(assetId) ?? 1) - 1
            if (count <= 0) assetSubscribers.delete(assetId)
            else assetSubscribers.set(assetId, count)
        })

        socket.on('disconnect', () => {
            logger.info(`[Socket.IO] Client disconnected: ${socket.id}`)
        })
    })

    return io
}