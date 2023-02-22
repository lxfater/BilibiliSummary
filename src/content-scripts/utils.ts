import Browser from 'webextension-polyfill'
// url change listener
export const urlChange = (callback: (url: string) => void) => {
    let lastUrl = window.location.href
    const observer = new MutationObserver((mutations) => {
        const url = window.location.href
        if (url !== lastUrl) {
            lastUrl = url
            callback(url)
        }
    })
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    })
}
export const getBVid = (url:string) => {
    const pattern = /\/(BV\w+)\//;
    const result = pattern.exec(url) as RegExpExecArray;
    const videoId = result[1];
    return videoId;
}
export const port = Browser.runtime.connect({ name: 'BilibiliSUMMARY' })