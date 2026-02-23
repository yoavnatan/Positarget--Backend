import { logger } from '../services/logger.service.js'
import type { Request, Response, NextFunction } from 'express'

export async function log(req: Request, res: Response, next: NextFunction) {
	const { baseUrl, method, body, params } = req
	logger.info(baseUrl, method, body, params)
	next()
}
