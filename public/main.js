import { marketService } from './services/market.service.js'
import { userService } from './services/user.service.js'
import { prettyJSON } from './services/util.service.js'

console.log('Simple driver to test some API calls')

window.onLoadMarkets = onLoadMarkets
window.onLoadUsers = onLoadUsers
window.onAddMarket = onAddMarket
window.onGetMarketById = onGetMarketById
window.onRemoveMarket = onRemoveMarket
window.onAddMarketMsg = onAddMarketMsg

async function onLoadMarkets() {
    const markets = await marketService.query()
    render('Markets', markets)
}
async function onLoadUsers() {
    const users = await userService.query()
    render('Users', users)
}

async function onGetMarketById() {
    const id = prompt('Market id?')
    if (!id) return
    const market = await marketService.getById(id)
    render('Market', market)
}

async function onRemoveMarket() {
    const id = prompt('Market id?')
    if (!id) return
    await marketService.remove(id)
    render('Removed Market')
}

async function onAddMarket() {
    await userService.login({ username: 'puki', password: '123' })
    const savedMarket = await marketService.save(marketService.getEmptyMarket())
    render('Saved Market', savedMarket)
}

async function onAddMarketMsg() {
    await userService.login({ username: 'puki', password: '123' })
    const id = prompt('Market id?')
    if (!id) return

    const savedMsg = await marketService.addMarketMsg(id, 'some msg')
    render('Saved Msg', savedMsg)
}

function render(title, mix = '') {
    console.log(title, mix)
    const output = prettyJSON(mix)
    document.querySelector('h2').innerText = title
    document.querySelector('pre').innerHTML = output
}

