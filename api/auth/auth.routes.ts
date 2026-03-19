import express from 'express'

import { login, signup, logout, createGuest } from './auth.controller.js'

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)
router.post('/guest', createGuest)

export const authRoutes = router