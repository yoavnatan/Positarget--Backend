import { eventService } from './services/event.service.js'
import { userService } from './services/user.service.js'
import { prettyJSON } from './services/util.service.js'

console.log('Simple driver to test some API calls')

window.onLoadEvents = onLoadEvents
window.onLoadUsers = onLoadUsers
window.onAddEvent = onAddEvent
window.onGetEventById = onGetEventById
window.onRemoveEvent = onRemoveEvent
window.onAddEventMsg = onAddEventMsg

async function onLoadEvents() {
    const events = await eventService.query()
    render('Events', events)
}
async function onLoadUsers() {
    const users = await userService.query()
    render('Users', users)
}

async function onGetEventById() {
    const id = prompt('Event id?')
    if (!id) return
    const event = await eventService.getById(id)
    render('Event', event)
}

async function onRemoveEvent() {
    const id = prompt('Event id?')
    if (!id) return
    await eventService.remove(id)
    render('Removed Event')
}

async function onAddEvent() {
    await userService.login({ username: 'puki', password: '123' })
    const savedEvent = await eventService.save(eventService.getEmptyEvent())
    render('Saved Event', savedEvent)
}

async function onAddEventMsg() {
    await userService.login({ username: 'puki', password: '123' })
    const id = prompt('Event id?')
    if (!id) return

    const savedMsg = await eventService.addEventMsg(id, 'some msg')
    render('Saved Msg', savedMsg)
}

function render(title, mix = '') {
    console.log(title, mix)
    const output = prettyJSON(mix)
    document.querySelector('h2').innerText = title
    document.querySelector('pre').innerHTML = output
}

