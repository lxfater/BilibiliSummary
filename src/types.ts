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
  