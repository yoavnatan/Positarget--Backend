import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { eventRoutes } from './api/event/event.routes.js'
import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
import { setupSocketIO } from './services/socket.service.js'  // ← חדש

const app = express()
const server = http.createServer(app)

app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'public')))

} else {
    const corsOptions = {
        origin: [
            'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
        ],
        credentials: true,
    }
    app.use(cors(corsOptions))
}

app.all('*all', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/event', eventRoutes)

import { Request, Response } from 'express'

app.get('/*all', (req: Request, res: Response) => {
    res.sendFile(path.resolve(process.cwd(), 'public', 'index.html'))
})

app.get('/ping', (req: Request, res: Response) => {
    res.status(200).send('pong');
});

import { logger } from './services/logger.service.js'
const port = process.env.PORT || 3030

server.listen(port, () => {
    logger.info('Server is running on port: ' + port)
    setupSocketIO(server)  // ← חדש
})