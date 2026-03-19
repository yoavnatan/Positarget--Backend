import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
import { FilterBy, Event, Msg } from './event.model'
import { eventService } from './event.service.js'
import type { Request, Response } from 'express'

export async function getEvents(req: Request, res: Response): Promise<void> {
	try {
		const filterBy = {
			category: req.query.category as string,
			page: parseInt(req.query.page as string) || 0,
			sortBy: req.query.sortBy as string || 'volume'
		}

		const events = await eventService.query(filterBy)
		res.json(events)
	} catch (err) {
		logger.error('Failed to get events', err)
		res.status(400).send({ err: 'Failed to get events' })
	}
}

export async function getEventById(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params
		const event = await eventService.getById(id as string)

		if (!event) {
			res.status(404).send({ err: 'Event not found' })
			return
		}

		res.json(event)
	} catch (err) {
		logger.error('Failed to get event', err)
		res.status(400).send({ err: 'Failed to get event' })
	}
}

export async function searchEvents(req: Request, res: Response): Promise<void> {
	try {
		const { q } = req.query
		const searchTerm = (q as string) || ''

		const events = await eventService.search(searchTerm)
		res.json(events)
	} catch (err) {
		logger.error('Failed to search events', err)
		res.status(400).send({ err: 'Failed to search events' })
	}
}

export async function getOrderBook(req: Request, res: Response): Promise<void> {
	try {
		const { clobTokenId } = req.query
		if (!clobTokenId) {
			res.status(400).send({ err: 'clobTokenId is required' })
			return
		}

		const orderbook = await eventService.getOrderBook(clobTokenId as string)
		res.json(orderbook)
	} catch (err) {
		logger.error('Failed to get orderbook', err)
		res.status(400).send({ err: 'Failed to get orderbook' })
	}
}

export async function getEventComments(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params
		const comments = await eventService.getComments(id as string)
		res.json(comments)
	} catch (err) {
		logger.error('Failed to get comments', err)
		res.status(400).send({ err: 'Failed to get comments' })
	}
}

export async function getMarketById(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params
		const market = await eventService.getMarketById(id as string)

		if (!market) {
			res.status(404).send({ err: 'Market not found' })
			return
		}

		res.json(market)
	} catch (err) {
		logger.error('Failed to get market', err)
		res.status(400).send({ err: 'Failed to get market' })
	}
}

export async function getPerformance(req: Request, res: Response): Promise<void> {
	try {
		const { portfolio } = req.body // מקבלים את המערך מה-Body
		const performance = await eventService.getPerformance(portfolio)
		res.json(performance)
	} catch (err) {
		logger.error('Failed to get performance', err)
		res.status(400).send({ err: 'Failed to get performance' })
	}
}

export async function getPriceHistory(req: Request, res: Response): Promise<void> {
	try {
		const { clobTokenId, interval } = req.query

		if (!clobTokenId) {
			res.status(400).send({ err: 'clobTokenId is required' })
			return
		}

		const history = await eventService.fetchMarketPriceHistory(
			clobTokenId as string,
			(interval as string) || ''
		)
		res.json(history)
	} catch (err) {
		logger.error('Failed to get price history', err)
		res.status(400).send({ err: 'Failed to get price history' })
	}
}


export async function addEventMsg(req: Request, res: Response): Promise<void> {
	try {
		const { eventId, txt } = req.body
		// בבק-אנד אנחנו שולפים את המשתמש מה-Token או מה-Session (כאן לצורך הדוגמה נניח שהוא נשלח)
		const loggedinUser = (req as any).loggedinUser // אם יש לך מידלוור של auth
		console.log('Logged in user:', loggedinUser) // בדיקה אם המשתמש מגיע נכון
		const msg = {
			txt,
			aboutEventId: eventId,
			by: loggedinUser
		}

		const savedMsg = await eventService.addEventMsg(msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to add message', err)
		res.status(400).send({ err: 'Failed to add message' })
	}
}

export async function removeEventMsg(req: Request, res: Response): Promise<void> {
	try {
		const { msgId } = req.params
		await eventService.removeEventMsg(msgId as string)
		res.send({ msg: 'Deleted successfully' })
	} catch (err) {
		logger.error('Failed to delete message', err)
		res.status(400).send({ err: 'Failed to delete message' })
	}
}

