import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { FilterBy, Event, Msg } from './event.model.js'

const PAGE_SIZE = 3

export const eventService = {
	remove,
	query,
	getById,
	add,
	update,
	addEventMsg,
	removeEventMsg,
}

async function query(filterBy: FilterBy) {
	try {
		const criteria = _buildCriteria(filterBy)
		const sort = _buildSort(filterBy)

		const collection = await dbService.getCollection('event')
		var eventCursor = await collection.find(criteria, { sort })

		if (filterBy.pageIdx !== undefined) {
			eventCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
		}

		const events = eventCursor.toArray()
		return events
	} catch (err) {
		logger.error('cannot find events', err)
		throw err
	}
}

async function getById(eventId: string) {
	try {
		const criteria = { _id: ObjectId.createFromHexString(eventId) }

		const collection = await dbService.getCollection('event')
		const event = await collection.findOne({ _id: new ObjectId(eventId) }) as Event | null
		if (event && event._id) event.createdAt = event._id.getTimestamp()
		return event
	} catch (err) {
		logger.error(`while finding event ${eventId}`, err)
		throw err
	}
}

async function remove(eventId: string) {
	const store = asyncLocalStorage.getStore()

	if (!store || !store.loggedinUser) {
		throw new Error('You must be logged in to remove a event')
	}
	const { loggedinUser } = store
	const { _id: ownerId, isAdmin } = loggedinUser
	try {
		const criteria = {
			_id: ObjectId.createFromHexString(eventId),
		}
		// if (!isAdmin) criteria['owner._id'] = ownerId

		const collection = await dbService.getCollection('event')
		const res = await collection.deleteOne(criteria)

		if (res.deletedCount === 0) throw ('Not your event')
		return eventId
	} catch (err) {
		logger.error(`cannot remove event ${eventId}`, err)
		throw err
	}
}

async function add(event: Event) {
	try {
		const collection = await dbService.getCollection('event')
		await collection.insertOne(event)

		return event
	} catch (err) {
		logger.error('cannot insert event', err)
		throw err
	}
}

async function update(event: Event) {
	const eventToSave = { title: event.title }

	try {
		const criteria = { _id: new ObjectId(event._id) }

		const collection = await dbService.getCollection('event')
		await collection.updateOne(criteria, { $set: eventToSave })

		return event
	} catch (err) {
		logger.error(`cannot update event ${event._id}`, err)
		throw err
	}
}

async function addEventMsg(eventId: string, msg: Msg): Promise<Msg> {
	try {
		const criteria = { _id: ObjectId.createFromHexString(eventId) }
		msg.id = makeId()

		const collection = await dbService.getCollection('event')
		await collection.updateOne(criteria, { $push: { msgs: msg } as any })

		return msg
	} catch (err) {
		logger.error(`cannot add event msg ${eventId}`, err)
		throw err
	}
}

async function removeEventMsg(eventId: string, msgId: string): Promise<string> {
	try {
		const criteria = { _id: ObjectId.createFromHexString(eventId) }

		const collection = await dbService.getCollection('event')
		await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } as any })

		return msgId
	} catch (err) {
		logger.error(`cannot remove event msg ${eventId}`, err)
		throw err
	}
}

function _buildCriteria(filterBy: FilterBy) {
	const criteria = {
		title: { $regex: filterBy.txt, $options: 'i' },
	}

	return criteria
}

function _buildSort(filterBy: FilterBy) {
	if (!filterBy.sortField) return {}
	return { [filterBy.sortField]: filterBy.sortDir }
}