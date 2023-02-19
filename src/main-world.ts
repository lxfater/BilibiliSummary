import {proxy} from "ajax-hook";
function absoluteUrl(relativeUrl: string): string {
    // @ts-ignore
  return relativeUrl.startsWith("//") ? "https:" + relativeUrl : relativeUrl
}


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