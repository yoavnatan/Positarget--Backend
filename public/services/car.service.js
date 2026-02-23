
import { httpService } from './http.service.js'
import { getRandomIntInclusive } from './util.service.js'



export const marketService = {
    query,
    getById,
    save,
    remove,
    getEmptyMarket,
    addMarketMsg
}
window.cs = marketService


async function query(filterBy = { txt: '', price: 0 }) {
    return httpService.get('market', filterBy)
}
function getById(marketId) {
    return httpService.get(`market/${marketId}`)
}

async function remove(marketId) {
    return httpService.delete(`market/${marketId}`)
}
async function save(market) {
    var savedMarket
    if (market._id) {
        savedMarket = await httpService.put(`market/${market._id}`, market)

    } else {
        savedMarket = await httpService.post('market', market)
    }
    return savedMarket
}

async function addMarketMsg(marketId, txt) {
    const savedMsg = await httpService.post(`market/${marketId}/msg`, { txt })
    return savedMsg
}


function getEmptyMarket() {
    return {
        vendor: 'Susita-' + (Date.now() % 1000),
        price: getRandomIntInclusive(1000, 9000),
    }
}





