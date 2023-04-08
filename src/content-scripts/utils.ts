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


export const getSubtitle = async (videoId:string) => {
    try {
        let result = await (await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`)).json()
        if(result.data.subtitle.list.length > 0) {
            let url = result.data.subtitle.list[0].subtitle_url.replace(/^http:/, 'https:')
            let subtitle = await (await fetch(url)).json()
            return subtitle.body
        } else {
            return null
        }
    } catch (error) {
        console.error(error)
        return null
    }
}
export const port = Browser.runtime.connect({ name: 'BILIBILISUMMARY' })