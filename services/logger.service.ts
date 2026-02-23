import fs from 'fs'
import { asyncLocalStorage } from './als.service.js'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface Logger {
	debug: (...args: unknown[]) => void
	info: (...args: unknown[]) => void
	warn: (...args: unknown[]) => void
	error: (...args: unknown[]) => void
}

export const logger: Logger = {
	debug: (...args) => doLog('DEBUG', ...args),
	info: (...args) => doLog('INFO', ...args),
	warn: (...args) => doLog('WARN', ...args),
	error: (...args) => doLog('ERROR', ...args),
}

const logsDir = './logs'

if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir)
}

function doLog(level: LogLevel, ...args: unknown[]): void {
	const store = asyncLocalStorage.getStore() as { loggedinUser?: { _id: string } } | undefined
	const userId = store?.loggedinUser?._id

	const strs = args.map(arg => {
		if (typeof arg === 'string') return arg
		if (_isError(arg)) return (arg as Error).stack || (arg as Error).message
		return JSON.stringify(arg)
	})

	if (userId) strs.push(userId)

	const line = `${_getTime()} - ${level} - ${strs.join(' | ')}\n`
	console.log(line)

	fs.appendFile(`${logsDir}/backend.log`, line, (err: Error | null) => {
		if (err) console.log('FATAL: cannot write to log file', err)
	})
}

function _getTime(): string {
	const now = new Date()
	return now.toLocaleString('he')
}

function _isError(e: any): e is Error {
	return e && e.stack && e.message
}