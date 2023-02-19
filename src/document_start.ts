import mainWorld from './main-world?script&module'
import Browser from 'webextension-polyfill'
const script = document.createElement('script')
script.src = Browser.runtime.getURL(mainWorld)
script.type = 'module'
document.head.prepend(script)