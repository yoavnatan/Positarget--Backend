import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'
import { FilterBy, Event, Msg } from './event.model.js'
import axios from 'axios'


export const eventService = {
	query,
	getById,
	search,
	getOrderBook,
	getComments,
	removeEventMsg,
	addEventMsg,
	getMarketById,
	getPerformance,
	fetchMarketPriceHistory,
}


const POLY_BASE = 'https://gamma-api.polymarket.com'

const categories = [
	"Politics", "Sports", "Crypto", "Finance", "Geopolitics",
	"Earnings", "Tech", "Culture", "World", "Economy",
	"Climate-science", "Mentions"
]



async function query(filterBy: any): Promise<any[]> {
	try {
		const { category = 'all', page = 0, sortBy = 'volume' } = filterBy
		const limit = 100
		const currentOffset = page * limit

		const CATEGORY_MAP: Record<string, string> = {
			"politics": "2", "sports": "100639", "crypto": "21", "finance": "120",
			"geopolitics": "100265", "earnings": "100262", "tech": "1401",
			"culture": "596", "world": "1", "economy": "100260",
			"climate-science": "100267", "mentions": "100251"
		}

		let url = `${POLY_BASE}/events?active=true&closed=false&limit=${limit}&offset=${currentOffset}&order=volume&ascending=false`

		if (category && category !== 'all') {
			const tagId = CATEGORY_MAP[category.toLowerCase()]
			if (tagId) url += `&tag_id=${tagId}`
		}

		const res = await axios.get(url)
		const data = res.data

		if (!data || data.length === 0) return []

		// עיבוד הנתונים (נורמליזציה)
		let events = _processRawEvents(data, category)

		// סינון ווליום נמוך
		events = events.filter(ev => ev.volume > 10)

		// מיון לוגי
		const now = Date.now()
		if (sortBy.toLowerCase() === 'trending') {
			events.sort((a, b) => {
				const getHours = (time: any) => {
					const t = typeof time === 'number' ? time : new Date(time).getTime()
					return Math.max(1, (now - t) / (1000 * 60 * 60))
				}
				return (b.volume / getHours(b.createdAt)) - (a.volume / getHours(a.createdAt))
			})
		} else if (sortBy.toLowerCase() === 'newest') {
			events.sort((a, b) => b.createdAt - a.createdAt)
		}

		return events
	} catch (err) {
		logger.error('cannot find events', err)
		throw err
	}
}

function _processRawEvents(combined: any[], forcedCategory?: string): any[] {
	const uniqueMap = new Map<string, any>()
	combined.forEach(ev => {
		if (ev?.id) uniqueMap.set(ev.id, ev)
	})

	const uniqueRawEvents = Array.from(uniqueMap.values())

	return uniqueRawEvents.map(ev => {
		const rawMarkets = ev.markets || []

		const markets = rawMarkets.slice(0, 5).map((m: any) => {
			const outcomes = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes
			const rawPrices = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices
			const clobTokenIds = typeof m.clobTokenIds === 'string' ? JSON.parse(m.clobTokenIds) : m.clobTokenIds

			const outcomesList = Array.isArray(outcomes) ? outcomes : ["Yes", "No"]
			const prices = Array.isArray(rawPrices)
				? rawPrices.map((p: string) => Math.round(parseFloat(p) * 100))
				: outcomesList.map(() => 50)

			return {
				id: m.id || ev.id,
				conditionId: m.conditionId || null,
				question: m.question || ev.title,
				outcomes: outcomesList,
				outcomePrices: prices,
				clobTokenIds: Array.isArray(clobTokenIds) ? clobTokenIds : [],
				volume: m.volume || 0,
				endDate: m.endDate || ev.endDate
			}
		})

		if (markets.length === 0) {
			markets.push({
				id: ev.id,
				conditionId: ev.conditionId || null,
				question: ev.title,
				outcomes: ["Yes", "No"],
				outcomePrices: [50, 50],
				clobTokenIds: []
			})
		}

		const eventTags = Array.isArray(ev.tags)
			? ev.tags.map((t: any) => (typeof t === 'string' ? t : t.label)).filter(Boolean)
			: []

		const primaryCat = (forcedCategory && forcedCategory.toLowerCase() !== 'all')
			? forcedCategory
			: categories.find(c => eventTags.some((tag: string) => tag.toLowerCase() === c.toLowerCase()))
			|| eventTags[0] || 'General'

		return {
			_id: ev.id,
			title: ev.title || ev.question || "Untitled Event",
			description: ev.description || "",
			createdAt: ev.createdAt ? new Date(ev.createdAt).getTime() : Date.now(),
			imgUrl: ev.image || ev.imgUrl || "https://polymarket.com/images/default.png",
			endDate: ev.endDate ? new Date(ev.endDate).getTime() : Date.now() + 86400000,
			status: ev.closed ? 'closed' : 'open',
			category: primaryCat,
			labels: Array.from(new Set([primaryCat, ...eventTags])),
			markets: markets,
			volume: Math.floor(ev.volume || 0),
			msgs: []
		}
	})
}

async function getById(eventId: string): Promise<any | null> {
	try {
		const url = `${POLY_BASE}/events/${eventId}`
		const res = await axios.get(url)

		if (!res.data) return null

		// הנירמול מצפה למערך, אז אנחנו עוטפים את האובייקט הבודד במערך
		const processedEvents = _processRawEvents([res.data])
		return processedEvents.length > 0 ? processedEvents[0] : null
	} catch (err) {
		logger.error(`Error fetching event by id ${eventId}`, err)
		throw err
	}
}


async function search(searchTerm: string, limit: number = 200): Promise<any[]> {
	if (!searchTerm) return []

	try {
		const POLY_SEARCH_API = 'https://gamma-api.polymarket.com/events/search'
		const url = `${POLY_SEARCH_API}?q=${encodeURIComponent(searchTerm)}&optimized=false&limit_per_type=${limit}&search_tags=true`

		const res = await axios.get(url)
		const rawResults = res.data.events || []

		// תיקון מבנה הנתונים לפני הנירמול
		const fixedResults = rawResults.map(function (ev: any) {
			return {
				...ev,
				id: ev.id || ev.eventId || ev._id,
				tags: Array.isArray(ev.tags)
					? ev.tags.map((t: any) => typeof t === 'string' ? { label: t } : t)
					: []
			}
		})

		return _processRawEvents(fixedResults)
	} catch (err) {
		logger.error(`Search failed for term: ${searchTerm}`, err)
		throw err
	}
}


async function getOrderBook(clobTokenId: string): Promise<any> {
	try {
		const POLY_CLOB_API = 'https://clob.polymarket.com'
		const url = `${POLY_CLOB_API}/book?token_id=${clobTokenId}`

		const res = await axios.get(url)
		const data = res.data

		function processLevels(levels: any[]) {
			let total = 0
			return (levels || []).map(function (level) {
				const size = parseFloat(level.size)
				const price = parseFloat(level.price)
				total += size
				return { price, size, total }
			})
		}

		return {
			bids: processLevels(data.bids),
			asks: processLevels(data.asks)
		}
	} catch (err) {
		logger.error(`Orderbook fetch error for token: ${clobTokenId}`, err)
		return { bids: [], asks: [] }
	}
}


async function getMarketById(marketId: string): Promise<any | null> {
	try {
		const url = `${POLY_BASE}/markets/${marketId}`
		const res = await axios.get(url)
		const raw = res.data

		if (!raw) return null

		const outcomes = typeof raw.outcomes === 'string' ? JSON.parse(raw.outcomes) : raw.outcomes
		const rawPrices = typeof raw.outcomePrices === 'string' ? JSON.parse(raw.outcomePrices) : raw.outcomePrices
		const clobTokenIds = typeof raw.clobTokenIds === 'string' ? JSON.parse(raw.clobTokenIds) : raw.clobTokenIds

		const prices = Array.isArray(rawPrices)
			? rawPrices.map(function (p: string) { return Math.round(parseFloat(p) * 100) })
			: []

		return {
			id: raw.id,
			eventId: raw.activeId || raw.eventId || raw.questionId || '',
			conditionId: raw.conditionId,
			question: raw.question,
			outcomePrices: prices,
			outcomes: Array.isArray(outcomes) ? outcomes : ["Yes", "No"],
			clobTokenIds: Array.isArray(clobTokenIds) ? clobTokenIds : [],
			description: raw.description || ""
		}
	} catch (err) {
		logger.error(`Error fetching market ${marketId}`, err)
		return null
	}
}

// Comments 
async function addEventMsg(msg: any): Promise<any> {
	try {
		if (!msg || !msg.by) {
			throw new Error('Message sender information (by) is missing')
		}

		const msgToAdd = {
			txt: msg.txt,
			by: {
				_id: msg.by._id,
				fullname: msg.by.fullname,
				imgUrl: msg.by.imgUrl || ''
			},
			aboutEventId: msg.aboutEventId,
			createdAt: Date.now()
		}

		const collection = await dbService.getCollection('comment')
		await collection.insertOne(msgToAdd)
		return msgToAdd
	} catch (err) {
		logger.error('cannot add event message', err)
		throw err
	}
}

async function removeEventMsg(msgId: string): Promise<void> {
	try {
		const collection = await dbService.getCollection('comment')

		console.log('Attempting to delete msgId:', msgId)
		const criteria = { _id: new ObjectId(msgId) }
		console.log('Criteria object:', criteria)
		await collection.deleteOne(criteria)
	} catch (err) {
		console.log(err)
		logger.error(`cannot remove message ${msgId}`, err)
		throw err
	}
}

async function getComments(eventId: string) {
	try {
		// 1. קריאה ל-Polymarket
		const polyRes = await axios.get(`https://gamma-api.polymarket.com/comments?parent_entity_type=Event&parent_entity_id=${eventId}`)
		const polyComments = Array.isArray(polyRes.data) ? polyRes.data : (polyRes.data.comments || [])

		// 2. קריאה מה-DB עם מיון (Sort) לפי זמן יצירה יורד
		const collection = await dbService.getCollection('comment')
		const localComments = await collection
			.find({ aboutEventId: eventId })
			.sort({ createdAt: -1 }) // -1 אומר מהחדש לישן
			.toArray()

		// 3. איחוד התוצאות - שים את החדשות שלך לפני אלו של Polymarket
		return [...localComments, ...polyComments]
	} catch (err) {
		logger.error(`Error fetching comments for ${eventId}`, err)
		throw err
	}
}



// Portfolio 


async function getPerformance(portfolio: any[]): Promise<any> {
	if (!portfolio || !portfolio.length) return { history: [], stats: null }

	try {
		const historyPromises = portfolio.map(async (pos) => {
			// שימוש ב-getMarketById שכבר קיים בסרוויס הזה
			const market = await getMarketById(pos.marketId)
			if (!market || !market.clobTokenIds?.[0]) return null

			// כאן אנחנו קוראים להיסטוריית המחירים (נניח שיש לך פונקציה כזו בסרוויס)
			const history = await fetchMarketPriceHistory(market.clobTokenIds[0])

			const latestPrice = history.length > 0 ? history[history.length - 1].value : 0

			return {
				shares: pos.shares,
				avgPriceInDollars: pos.avgPrice / 100,
				latestPrice,
				history
			}
		})

		const results = (await Promise.all(historyPromises)).filter(p => !!p)

		let totalCostBasis = 0
		let totalCurrentValue = 0
		const timeMap: Record<number, number> = {}

		results.forEach((pos: any) => {
			totalCostBasis += pos.shares * pos.avgPriceInDollars
			totalCurrentValue += pos.shares * pos.latestPrice

			pos.history.forEach((point: any) => {
				const time = Number(point.time)
				timeMap[time] = (timeMap[time] || 0) + (pos.shares * point.value)
			})
		})

		const history = Object.entries(timeMap)
			.map(([time, value]) => ({ time: Number(time), value }))
			.sort((a, b) => a.time - b.time)

		const totalPnl = totalCurrentValue - totalCostBasis
		const pnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0

		return {
			history,
			stats: {
				currentTotalValue: totalCurrentValue,
				totalPnl,
				pnlPercent
			}
		}
	} catch (err) {
		logger.error('Failed to calculate performance', err)
		throw err
	}
}


async function fetchMarketPriceHistory(clobTokenId: string, interval: string = ''): Promise<any[]> {
	try {
		const POLY_CLOB_API = 'https://clob.polymarket.com'
		const url = `${POLY_CLOB_API}/prices-history?market=${clobTokenId}&interval=${interval}`

		const res = await axios.get(url)
		const data = res.data

		if (!data || !data.history) return []

		// נירמול הנתונים מהפורמט המקוצר של Polymarket לפורמט קריא
		return data.history.map(function (point: { t: number, p: number }) {
			return {
				time: point.t,
				value: point.p
			}
		})
	} catch (err) {
		logger.error(`Error fetching CLOB history for token: ${clobTokenId}`, err)
		return []
	}
}