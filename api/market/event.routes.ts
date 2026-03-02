import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getEvents, getEventById, addEvent, updateEvent, removeEvent, addEventMsg, removeEventMsg } from './event.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getEvents)
router.get('/:id', log, getEventById)
router.post('/', log, requireAuth, addEvent)
router.put('/:id', requireAuth, updateEvent)
router.delete('/:id', requireAuth, removeEvent)
// router.delete('/:id', requireAuth, requireAdmin, removeEvent)

router.post('/:id/msg', requireAuth, addEventMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeEventMsg)

export const eventRoutes = router