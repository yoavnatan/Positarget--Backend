export interface User {
    _id: string
    email: string
    firstName: string
    lastName: string
    isAdmin: boolean
    username: string
    imgUrl?: string
    password?: string

    cash?: number          // יתרת מזומן
    portfolio?: Position[] // החזקות לפי מרקט
}

export type UserFilter = {
    txt?: string
}


export type Position = {
    eventId: string
    outcome: 'YES' | 'NO'
    shares: number
    avgPrice: number
}
