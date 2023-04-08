export interface SubTitle {
    font_size: number
    font_color: string
    background_alpha: number
    background_color: string
    Stroke: string
    type: string
    lang: string
    version: string
    body: Body[]
}
export interface Body {
    from: number
    to: number
    sid: number
    location: number
    content: string
    music: number
}

export type Job =  {
    type: 'getSummary' | 'getGpt3Summary' | 'forceSummaryWithNewToken' | 'cancel'
    videoId: string
    subtitle: SubTitle
    title: string
    summaryTokenNumber?: number
    refreshToken?: boolean
    force?: boolean
    timeout?: number
}

export type PortName = 'CHATGPT' | 'BILIBILISUMMARY'