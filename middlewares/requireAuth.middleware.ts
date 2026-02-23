import { config } from '../config/index.js'
import { logger } from '../services/logger.service.js'
import { asyncLocalStorage } from '../services/als.service.js'
import type { Request, Response, NextFunction } from 'express'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const store = asyncLocalStorage.getStore()
	const loggedinUser = store?.loggedinUser

	if (config.isGuestMode && !loggedinUser) {
		req.loggedinUser = { _id: '', username: 'Guest' }
		return next()
	}

	if (!loggedinUser) {
		return res.status(401).send('Not Authenticated')
	}

	// אין צורך ב-as any! TS מזהה את loggedinUser בזכות הקובץ שיצרנו
	req.loggedinUser = loggedinUser
	next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	const store = asyncLocalStorage.getStore()
	const loggedinUser = store?.loggedinUser

	if (!loggedinUser) {
		return res.status(401).send('Not Authenticated')
	}

	if (!loggedinUser.isAdmin) {
		logger.warn(`${loggedinUser.username} attempted to perform admin action`)
		return res.status(403).send('Not Authorized')
	}
	next()
}