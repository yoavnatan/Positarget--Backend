import { authService } from '../api/auth/auth.service.js'
import { User } from '../api/user/user.model.js'
import { asyncLocalStorage } from '../services/als.service.js'
import type { Request, Response, NextFunction } from 'express'


export async function setupAsyncLocalStorage(req: Request, res: Response, next: NextFunction) {
	const storage = {}

	asyncLocalStorage.run(storage, () => {
		if (!req.cookies?.loginToken) return next()
		const loggedinUser: User = authService.validateToken(req.cookies.loginToken)

		if (loggedinUser) {
			const alsStore = asyncLocalStorage.getStore()
			if (alsStore) alsStore.loggedinUser = loggedinUser
		}
		next()
	})
}
