import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { FilterBy, Market, Msg } from './market.model.js'

const PAGE_SIZE = 3

export const marketService = {
	remove,
	query,
	getById,
	add,
	update,
	addMarketMsg,
	removeMarketMsg,
}

async function query(filterBy: FilterBy) {
	try {
		const criteria = _buildCriteria(filterBy)
		const sort = _buildSort(filterBy)

		const collection = await dbService.getCollection('market')
		var marketCursor = await collection.find(criteria, { sort })

		if (filterBy.pageIdx !== undefined) {
			marketCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
		}

		const markets = marketCursor.toArray()
		return markets
	} catch (err) {
		logger.error('cannot find markets', err)
		throw err
	}
}

async function getById(marketId: string) {
	try {
		const criteria = { _id: ObjectId.createFromHexString(marketId) }

		const collection = await dbService.getCollection('market')
		const market = await collection.findOne({ _id: new ObjectId(marketId) }) as Market | null
		if (market && market._id) market.createdAt = market._id.getTimestamp()
		return market
	} catch (err) {
		logger.error(`while finding market ${marketId}`, err)
		throw err
	}
}

async function remove(marketId: string) {
	const store = asyncLocalStorage.getStore()

	if (!store || !store.loggedinUser) {
		throw new Error('You must be logged in to remove a market')
	}
	const { loggedinUser } = store
	const { _id: ownerId, isAdmin } = loggedinUser
	try {
		const criteria = {
			_id: ObjectId.createFromHexString(marketId),
		}
		// if (!isAdmin) criteria['owner._id'] = ownerId

		const collection = await dbService.getCollection('market')
		const res = await collection.deleteOne(criteria)

		if (res.deletedCount === 0) throw ('Not your market')
		return marketId
	} catch (err) {
		logger.error(`cannot remove market ${marketId}`, err)
		throw err
	}
}

async function add(market: Market) {
	try {
		const collection = await dbService.getCollection('market')
		await collection.insertOne(market)

		return market
	} catch (err) {
		logger.error('cannot insert market', err)
		throw err
	}
}

async function update(market: Market) {
	const marketToSave = { title: market.title }

	try {
		const criteria = { _id: new ObjectId(market._id) }

		const collection = await dbService.getCollection('market')
		await collection.updateOne(criteria, { $set: marketToSave })

		return market
	} catch (err) {
		logger.error(`cannot update market ${market._id}`, err)
		throw err
	}
}

async function addMarketMsg(marketId: string, msg: Msg): Promise<Msg> {
	try {
		const criteria = { _id: ObjectId.createFromHexString(marketId) }
		msg.id = makeId()

		const collection = await dbService.getCollection('market')
		await collection.updateOne(criteria, { $push: { msgs: msg } as any })

		return msg
	} catch (err) {
		logger.error(`cannot add market msg ${marketId}`, err)
		throw err
	}
}

async function removeMarketMsg(marketId: string, msgId: string): Promise<string> {
	try {
		const criteria = { _id: ObjectId.createFromHexString(marketId) }

		const collection = await dbService.getCollection('market')
		await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } as any })

		return msgId
	} catch (err) {
		logger.error(`cannot remove market msg ${marketId}`, err)
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