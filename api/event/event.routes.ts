import express from 'express'
import { addEventMsg, getEventById, getEventComments, getEvents, getMarketById, getOrderBook, getPerformance, getPriceHistory, removeEventMsg, searchEvents } from './event.controller'
import { requireAuth } from '../../middlewares/requireAuth.middleware'

const router = express.Router()

router.get('/', getEvents)
router.get('/price-history', getPriceHistory)
router.get('/orderbook', getOrderBook)
router.post('/performance', getPerformance)
router.get('/:id/comments', getEventComments)
router.get('/:id', getEventById)
router.get('/search', searchEvents)
router.post('/:id/msg', requireAuth, addEventMsg)
router.delete('/msg/:msgId', requireAuth, removeEventMsg)
router.get('/market/:id', getMarketById)


export const eventRoutes = router