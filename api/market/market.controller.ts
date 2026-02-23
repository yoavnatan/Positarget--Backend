import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
import { FilterBy, Market, Msg } from './market.model.js'
import { marketService } from './market.service.js'
import type { Request, Response } from 'express'

export async function getMarkets(req: Request, res: Response) {
	try {
		const filterBy = {
			txt: req.query.txt || '',
			sortField: req.query.sortField || '',
			sortDir: req.query.sortDir || 1,
			pageIdx: req.query.pageIdx,
		}
		const markets = await marketService.query(filterBy as FilterBy)
		res.json(markets)
	} catch (err) {
		logger.error('Failed to get markets', err)
		res.status(400).send({ err: 'Failed to get markets' })
	}
}

export async function getMarketById(req: Request, res: Response) {
	try {
		const marketId = req.params.id
		const market = await marketService.getById(marketId as string)
		res.json(market)
	} catch (err) {
		logger.error('Failed to get market', err)
		res.status(400).send({ err: 'Failed to get market' })
	}
}

export async function addMarket(req: Request, res: Response) {
	const { loggedinUser, body } = req
	const market: Market = {
		title: body.title,
		status: 'closed',
		yesShares: 0,
		noShares: 0,
		endDate: 0,
		description: '',
		msgs: []
	}
	try {
		// market.owner = loggedinUser
		const addedMarket = await marketService.add(market)
		res.json(addedMarket)
	} catch (err) {
		logger.error('Failed to add market', err)
		res.status(400).send({ err: 'Failed to add market' })
	}
}

export async function updateMarket(req: Request, res: Response) {
	const { loggedinUser, body: market } = req
	if (!loggedinUser) {
		res.status(401).send('User not logged in')
		return
	}
	const userId = loggedinUser._id
	const isAdmin = 'isAdmin' in loggedinUser ? loggedinUser.isAdmin : false

	if (!isAdmin && market.owner._id !== userId) {
		res.status(403).send('Not your market...')
		return
	}

	try {
		const updatedMarket = await marketService.update(market)
		res.json(updatedMarket)
	} catch (err) {
		logger.error('Failed to update market', err)
		res.status(400).send({ err: 'Failed to update market' })
	}
}

export async function removeMarket(req: Request, res: Response) {
	try {
		const marketId = req.params.id
		const removedId = await marketService.remove(marketId as string)

		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove market', err)
		res.status(400).send({ err: 'Failed to remove market' })
	}
}

export async function addMarketMsg(req: Request, res: Response) {
	const { loggedinUser } = req

	try {
		const marketId = req.params.id
		const msg = {
			txt: req.body.txt,
			by: loggedinUser,
		}
		const savedMsg = await marketService.addMarketMsg(marketId as string, msg as Msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to add market msg', err)
		res.status(400).send({ err: 'Failed to add market msg' })
	}
}

export async function removeMarketMsg(req: Request, res: Response) {
	try {
		const { id: marketId, msgId } = req.params

		const removedId = await marketService.removeMarketMsg(marketId as string, msgId as string)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove market msg', err)
		res.status(400).send({ err: 'Failed to remove market msg' })
	}
}
