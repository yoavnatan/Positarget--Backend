
import { httpService } from './http.service.js'
import { getRandomIntInclusive } from './util.service.js'



export const eventService = {
    query,
    getById,
    save,
    remove,
    getEmptyEvent,
    addEventMsg
}
window.cs = eventService


async function query(filterBy = { txt: '', price: 0 }) {
    return httpService.get('event', filterBy)
}
function getById(eventId) {
    return httpService.get(`event/${eventId}`)
}

async function remove(eventId) {
    return httpService.delete(`event/${eventId}`)
}
async function save(event) {
    var savedEvent
    if (event._id) {
        savedEvent = await httpService.put(`event/${event._id}`, event)

    } else {
        savedEvent = await httpService.post('event', event)
    }
    return savedEvent
}

async function addEventMsg(eventId, txt) {
    const savedMsg = await httpService.post(`event/${eventId}/msg`, { txt })
    return savedMsg
}


function getEmptyEvent() {
    return {
        vendor: 'Susita-' + (Date.now() % 1000),
        price: getRandomIntInclusive(1000, 9000),
    }
}





