import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
import { FilterBy, Event, Msg } from './event.model.js'
import { eventService } from './event.service.js'
import type { Request, Response } from 'express'

export async function getEvents(req: Request, res: Response) {
	try {
		const filterBy = {
			txt: req.query.txt || '',
			sortField: req.query.sortField || '',
			sortDir: req.query.sortDir || 1,
			pageIdx: req.query.pageIdx,
		}
		const events = await eventService.query(filterBy as FilterBy)
		res.json(events)
	} catch (err) {
		logger.error('Failed to get events', err)
		res.status(400).send({ err: 'Failed to get events' })
	}
}

export async function getEventById(req: Request, res: Response) {
	try {
		const eventId = req.params.id
		const event = await eventService.getById(eventId as string)
		res.json(event)
	} catch (err) {
		logger.error('Failed to get event', err)
		res.status(400).send({ err: 'Failed to get event' })
	}
}

export async function addEvent(req: Request, res: Response) {
	const { loggedinUser, body } = req
	const event: Event = {
		title: body.title,
		status: 'closed',
		yesShares: 0,
		noShares: 0,
		endDate: 0,
		description: '',
		msgs: []
	}
	try {
		// event.owner = loggedinUser
		const addedEvent = await eventService.add(event)
		res.json(addedEvent)
	} catch (err) {
		logger.error('Failed to add event', err)
		res.status(400).send({ err: 'Failed to add event' })
	}
}

export async function updateEvent(req: Request, res: Response) {
	const { loggedinUser, body: event } = req
	if (!loggedinUser) {
		res.status(401).send('User not logged in')
		return
	}
	const userId = loggedinUser._id
	const isAdmin = 'isAdmin' in loggedinUser ? loggedinUser.isAdmin : false

	if (!isAdmin && event.owner._id !== userId) {
		res.status(403).send('Not your event...')
		return
	}

	try {
		const updatedEvent = await eventService.update(event)
		res.json(updatedEvent)
	} catch (err) {
		logger.error('Failed to update event', err)
		res.status(400).send({ err: 'Failed to update event' })
	}
}

export async function removeEvent(req: Request, res: Response) {
	try {
		const eventId = req.params.id
		const removedId = await eventService.remove(eventId as string)

		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove event', err)
		res.status(400).send({ err: 'Failed to remove event' })
	}
}

export async function addEventMsg(req: Request, res: Response) {
	const { loggedinUser } = req

	try {
		const eventId = req.params.id
		const msg = {
			txt: req.body.txt,
			by: loggedinUser,
		}
		const savedMsg = await eventService.addEventMsg(eventId as string, msg as Msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to add event msg', err)
		res.status(400).send({ err: 'Failed to add event msg' })
	}
}

export async function removeEventMsg(req: Request, res: Response) {
	try {
		const { id: eventId, msgId } = req.params

		const removedId = await eventService.removeEventMsg(eventId as string, msgId as string)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove event msg', err)
		res.status(400).send({ err: 'Failed to remove event msg' })
	}
}
