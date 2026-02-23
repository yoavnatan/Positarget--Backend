import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getMarkets, getMarketById, addMarket, updateMarket, removeMarket, addMarketMsg, removeMarketMsg } from './market.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getMarkets)
router.get('/:id', log, getMarketById)
router.post('/', log, requireAuth, addMarket)
router.put('/:id', requireAuth, updateMarket)
router.delete('/:id', requireAuth, removeMarket)
// router.delete('/:id', requireAuth, requireAdmin, removeMarket)

router.post('/:id/msg', requireAuth, addMarketMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeMarketMsg)

export const marketRoutes = router