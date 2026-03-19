import { authService } from './auth.service.js'
import { logger } from '../../services/logger.service.js'
import type { Request, Response } from 'express'
import { userService } from '../user/user.service.js'
import { User } from '../user/user.model.js'


export async function login(req: Request, res: Response) {
	const { username, password } = req.body
	try {
		if (username === 'guest' && password === 'guest') {
			try {
				const user = await userService.getByUsername('guest')
				if (!user) {
					await authService.signup({
						username: 'guest',
						password: 'guest',
						email: 'guest@guest.com',
						isAdmin: false
					} as unknown as User)
					logger.info(`Guest user created`)
				}
			} catch (err) {
				logger.debug('Guest already exists or signup skipped')
			}
		}

		const user = await authService.login(username, password)
		const loginToken = authService.getLoginToken(user)

		res.cookie('loginToken', loginToken, {
			sameSite: 'none',
			secure: true,
			maxAge: 1000 * 60 * 60 * 24 * 7
		})

		res.json(user)
	} catch (err) {
		logger.error('Failed to Login ' + err)
		res.status(401).send({ err: 'Failed to Login' })
	}
}

export async function signup(req: Request, res: Response) {
	try {
		const credentials = req.body

		// Never log passwords
		// logger.debug(credentials)

		const account = await authService.signup(credentials)
		logger.debug(`auth.route - new account created: ` + JSON.stringify(account))

		const user = await authService.login(credentials.username, credentials.password)
		logger.info('User signup:', user)

		const loginToken = authService.getLoginToken(user)
		res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })
		res.json(user)
	} catch (err) {
		logger.error('Failed to signup ' + err)
		res.status(400).send({ err: 'Failed to signup' })
	}
}

export async function logout(req: Request, res: Response) {
	try {
		res.clearCookie('loginToken')
		res.send({ msg: 'Logged out successfully' })
	} catch (err) {
		res.status(400).send({ err: 'Failed to logout' })
	}
}



export async function createGuest(req: Request, res: Response) {
	try {
		const randomId = Math.floor(Math.random() * 10000)

		// יצירת אובייקט אורח שעומד בסטנדרטים של ה-User Interface שלך
		const guestData = {
			username: `guest_${randomId}_${Date.now()}`,
			password: 'password123', // סיסמה פנימית שרק השרת מכיר
			email: `guest_${randomId}@guest.com`,
		}

		// 1. רישום האורח ב-DB (יוצר מסמך חדש ב-MongoDB)
		const user = await authService.signup(guestData as User)

		// 2. יצירת Token כדי שהדפדפן יזהה אותו כ"מחובר" (Session)
		// const loginToken = authService.getLoginToken(user as User)

		// 3. שליחת הקוקי חזרה לפרונט
		// res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })

		// 4. מחזירים את היוזר המלא (כולל ה-_id החדש ממונגו)
		res.json(guestData)
	} catch (err) {
		logger.error('Failed to create guest', err)
		res.status(400).send({ err: 'Failed to create guest' })
	}
}