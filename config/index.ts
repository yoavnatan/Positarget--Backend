import configProd from './prod.js'
import configDev from './dev.js'

export interface Config {
  dbURL: string
  dbName: string
  isGuestMode?: boolean
}


export var config: Config

if (process.env.NODE_ENV === 'production') {
  config = configProd
} else {
  config = configDev
}
// config.isGuestMode = true


