import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'
import { User, UserFilter } from './user.model.js'

export const userService = {
    add, // Create (Signup)
    getById, // Read (Profile page)
    update, // Update (Edit profile)
    remove, // Delete (remove user)
    query, // List (of users)
    getByUsername, // Used for Login
}

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy as UserFilter)
    try {
        const collection = await dbService.getCollection('user')
        var users = await collection.find(criteria).toArray()
        users = users.map(user => {
            delete user.password
            user.createdAt = user._id.getTimestamp()
            // Returning fake fresh data
            // user.createdAt = Date.now() - (1000 * 60 * 60 * 24 * 3) // 3 days ago
            return user
        })
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}

async function getById(userId: string) {
    try {
        var criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection('user')
        const user = await collection.findOne(criteria)
        if (user) delete user.password

        return user
    } catch (err) {
        logger.error(`while finding user by id: ${userId}`, err)
        throw err
    }
}

async function getByUsername(username: string) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ username })
        return user
    } catch (err) {
        logger.error(`while finding user by username: ${username}`, err)
        throw err
    }
}

async function remove(userId: string) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection('user')
        await collection.deleteOne(criteria)
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(user: User) {
    try {
        const userToSave = {
            _id: new ObjectId(user._id),
            username: user.username,
            favoriteEvents: user.favoriteEvents || [], // שומר על המערך הקיים או מערך ריק
            cash: user.cash || 0, // שומר על הערך הקיים או 0
            portfolio: user.portfolio || [] // שומר על המערך הקיים או מערך ריק
        }

        const collection = await dbService.getCollection('user')

        // 2. עדכון ב-DB
        // שימוש ב-$set מעדכן רק את השדות ששלחנו ושומר על שאר השדות (כמו password) ללא שינוי
        await collection.updateOne(
            { _id: userToSave._id },
            { $set: userToSave }
        )

        // מחזירים את האובייקט המעודכן (שים לב: ללא סיסמה!)
        return userToSave
    } catch (err) {
        logger.error(`cannot update user ${user._id}`, err)
        throw err
    }
}

async function add(user: User) {
    try {
        // peek only updatable fields!
        const userToAdd = {
            username: user.username,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            imgUrl: user.imgUrl,
            isAdmin: user.isAdmin,
            email: user.email,
        }
        const collection = await dbService.getCollection('user')
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('cannot add user', err)
        throw err
    }
}

function _buildCriteria(filterBy: UserFilter) {
    const criteria: any = {}

    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }

        criteria.$or = [
            { username: txtCriteria },
            { fullname: txtCriteria },
            { email: txtCriteria }
        ]
    }

    return criteria
}