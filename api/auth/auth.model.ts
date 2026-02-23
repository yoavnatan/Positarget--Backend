import { ObjectId } from "mongodb"

export interface UserCred {
    username?: string
    email?: string
    password?: string
}