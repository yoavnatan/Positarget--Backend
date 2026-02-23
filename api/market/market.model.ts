import { User } from "../user/user.model"
import { ObjectId } from 'mongodb'

export interface Market {
    _id?: ObjectId
    title: string
    status: 'open' | 'closed'
    yesShares: number
    noShares: number
    endDate: number
    description: string
    msgs: Msg[]
    createdAt?: Date
}

export type FilterBy = {
    txt: string
    status?: 'open' | 'closed' | 'all'
    sortField: string
    sortDir: 1 | -1
    pageIdx?: number
}

export interface Msg {
    id: string;
    by: User;
    txt: string;
}