import {proxy} from "ajax-hook";
function absoluteUrl(relativeUrl: string): string {
    // @ts-ignore
  return relativeUrl.startsWith("//") ? "https:" + relativeUrl : relativeUrl
}

window.addEventListener('message', function(event) {
    if (event.data.type === 'goto') {
        //@ts-ignore
        window.player.seek(parseInt(event.data.content))
    }
});
export const getBVid = (url:string) => {
    const pattern = /\/(BV\w+)\//;
    const result = pattern.exec(url) as RegExpExecArray;
    const videoId = result[1];
    return videoId;
}


export const getSubtitle = async (videoId:string) => {
    try {
        let result = await (await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`,{
            credentials: 'include',
        })).json()
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
let id = getBVid(window.location.href)
getSubtitle(id).then(x => {
    if (x) {
        window.postMessage({ type: 'getSummary', content: JSON.stringify({
            body: x,
        })},'*' /* targetOrigin: any */ );
    }
})

proxy({
    onResponse: (response, handler) => {
        const url = new URL(absoluteUrl(response.config.url));
        if (/bfs\/ai_subtitle\/prod.*/.test(url.pathname)) {
            const subtitleList= response.response
            window.postMessage({ type: 'getSummary', content: JSON.stringify(subtitleList)},'*' /* targetOrigin: any */ );
        }
        handler.next(response);
    },
});