import Browser from 'webextension-polyfill'
import { getSmallSizeTranscripts, getSummaryPrompt } from './prompt';
import { Openai } from '../ai/provider/openai';
import { OpenaiSetting } from '../config';
import { Body } from '../types';
import { ExtensionStorage  } from '../store/index'

function getPrompt(content: Body[], words: number, baseTime: number,step: number, maxCount = 5, minCount =3, count = 188) {
  let group = groupSubtitleByTime(content,baseTime,step, maxCount, minCount, count);
  let totalLength = group.map(x => x.map(y => y.content)).join('').length;
  console.log(totalLength, '总字数')
  let times: string[] = [];
  let result = group.map(textData => {
    let from = textData[0].from;
    let itemLength = textData.map(x => x.content).join('').length
    const group = textData.map((item, index) => {
      return {
        text: item.content,
        index: index
      }
    })
    const limit = Math.max(30, Math.round( itemLength / totalLength * (words * 2)))
    const content = getSmallSizeTranscripts(group, group,limit);
    return {
      from: from,
      content: content
    }
  }).filter(x => x.content.length > 0).map(x => {
    times.push(x.from)
    return `${x.from}: ${x.content}`
  })
  const text = result.join('\n')
  const prompt = getSummaryPrompt('',text, times);

  return prompt;
}

// group the subtitle by the time
function groupSubtitleByTime(subtitle: Body[], baseTime: number,step: number, maxCount =  6, minCount =3, count = 188) {

    const groupSubtitle: Body[][] = [];
    let group: Body[] = [];
    let lastTime = 0;
    for (let i = 0; i < subtitle.length; i++) {
        const item = subtitle[i];
        if (lastTime === 0) {
            lastTime = item.from;
            group.push(item);
        } else {  
            if (item.from - lastTime < baseTime) {
                group.push(item);
            } else {
                groupSubtitle.push(group);
                group = [];
                group.push(item);
            }
            lastTime = item.from;
        }
    }
    if (group.length > 0) {
        groupSubtitle.push(group);
    }
    if (groupSubtitle.length > maxCount && count > 0) {
      return groupSubtitleByTime(subtitle, baseTime + step, step, maxCount, minCount, count -1)
    } else if (groupSubtitle.length < minCount && count > 0) {
      return groupSubtitleByTime(subtitle, baseTime - step, step, maxCount, minCount, count - 1)
    }

    return groupSubtitle
}

// 将字幕里面的content根据数字分为几个集合
function groupSubtitleByCount(subtitle: Body[], count: number) {
    const groupSubtitle: Body[][] = [];
    let group: Body[] = [];
    let textLength = 0;
    for (let i = 0; i < subtitle.length; i++) {
        const item = subtitle[i];
        textLength += item.content.length;
        if (textLength < count) {
            group.push(item);
        } else {
            groupSubtitle.push(group);
            group = [];
            textLength = 0;
        }
    }
    if (group.length > 0) {
        groupSubtitle.push(group);
    }
    return groupSubtitle
}

class SummaryCache {
  public async getSummary(key: string) {
    try {
      let result = await Browser.storage.local.get([key]);
      if (result[key]) {
        return null;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  public async setSummary(key: string, value: string) {
    try {
      await Browser.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(error);
    }
  }
}
const summaryCache = new SummaryCache();

class CommonService {
  async openOptionsPage() {
    const optionsUrl = Browser.runtime.getURL('option.html');
    const tabs = await Browser.tabs.query({url: optionsUrl});
    if (tabs.length && tabs[0] && tabs[0].windowId) {
      Browser.windows.update(tabs[0].windowId, {focused: true});
    } else {
      Browser.runtime.openOptionsPage()
    }
  }
}
const commonService = new CommonService();


// write a code to await ms
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
let storage = new ExtensionStorage();
class Store {
  optionKey ='meta'
  openai = "Openai"
  chatgpt = "ChatgptWeb"
  async getType() {
    let result = await Browser.storage.local.get([this.optionKey])
    if(result[this.optionKey]) {
        return result[this.optionKey].providerType
    } else {
      return "ChatgptWeb"
    }
  }
  async getOpenaiSetting() {
    let result = await Browser.storage.local.get([this.optionKey])
    if(result[this.optionKey]) {
        return result[this.optionKey].OpenaiSetting 
    } else {
      return storage.getDefaultMetaKey().ChatgptWebSetting
    }
  }
  async getChatgptSetting() {
    let result = await Browser.storage.local.get([this.optionKey])
    if(result[this.optionKey]) {
        return result[this.optionKey].ChatgptWebSetting
    } else {
      return storage.getDefaultMetaKey().ChatgptWebSetting
    }
  }
}
const store = new Store();

class OpenaiProvider {
    private lastController: AbortController | null = null;
    openai: Openai;
    constructor(private port: Browser.Runtime.Port, apikey: string, model: string, maxTokens: number) {
        this.openai = new Openai(apikey, model, maxTokens);
    }
    private cancel() {
      if (this.lastController) {
        this.lastController.abort();
        this.lastController = null;
      }
      this.port.postMessage({
        type: 'error',
        content: 'cancel'
      });
    }
  
    private timeout(ms: number) {
      return setTimeout(() => {
        this.cancel();
        this.port.postMessage({
          type: 'error',
          content: 'timeout'
        });
      }, ms);
    }
  
    public async handleJob(job) {
      if (job.type === 'getSummary') {
        let cache = await summaryCache.getSummary(job.videoId)
        if(cache) {
            this.port.postMessage({
                type: 'summary',
                content: {
                    videoId: job.videoId,
                    message: cache
                }
            })
            return 0;
        }
        if (this.lastController && job.force === false) {
            this.port.postMessage({
                type: 'error',
                content: 'onlyOne'
            });
            return 0;
        } 
  
        try {
          if (this.lastController) {
            this.lastController.abort();
          }
          this.lastController = new AbortController();
          let setting = await store.getOpenaiSetting()
          const timeoutThreshold = setting.timeout * 30 * 1000;
          const timeoutHandle = this.timeout(timeoutThreshold);
          const stopIntervalMs = setting.stopIntervalMs || 500
          const questions =groupSubtitleByCount(job.subtitle,parseFloat(setting.stopCount)).map(x => {
            return getPrompt(x,parseInt(setting.words),parseFloat(setting.baseTime),parseFloat(setting.step),parseInt(setting.maxCount), parseInt(setting.minCount), parseInt(setting.count))
          })
          let resultSum = ''
          for await (const question of questions) {
            try {
              let result = await this.openai.ask(question,{
                signal: this.lastController!.signal,
                onMessage: (m) => {
                    clearTimeout(timeoutHandle);
                    this.port.postMessage({
                      type: 'summary',
                      content: {
                        message: m.message,
                        videoId: job.videoId
                      }
                    });
                }})  as string
              resultSum += result
              this.port.postMessage({
                type: 'summaryFinal',
                content: {
                  message: result,
                  videoId: job.videoId
                }
              });
              try {
                clearTimeout(timeoutHandle);
              } catch (error) {
                console.error(error);
              }
              await sleep(stopIntervalMs)
            } catch (error) {
              console.error(error);
              this.port.postMessage({
                type: 'error',
                content: error.message
              });
            }

          }

          try {
            await summaryCache.setSummary(job.videoId,resultSum)
          } catch (error) {
            console.error(error);
          }
        } catch (error: any) {
          console.error(error);
          this.port.postMessage({
            type: 'error',
            content: error.message
          });
        } finally {
          this.lastController = null;
        }
      } else if (job.type === 'cancel') {
        this.cancel();
      }
    }
}
class ChatgptConnector {
    BilibiliSummaryPort: Browser.Runtime.Port | null = null
    ChatgptPort: Browser.Runtime.Port | null = null
    async connect() {
        let tabs =  await Browser.tabs.query({})
        let find = false
        for await (let tab of tabs) {
            if (tab.url && tab.url!.includes("https://chat.openai.com")) {
                const updateProperties = { 'active': true };
                await Browser.tabs.update(tab.id!, updateProperties);
                await Browser.tabs.reload(tab.id!)
                find = true
            }
        }
    
        if(!find) {
            await Browser.tabs.create({url: "https://chat.openai.com"})
        }
    }
    async sendToChatgptPort(job: any,port: Browser.Runtime.Port) {
        if(job.type === 'login') {
            await this.connect()
            setTimeout(() => {
                port.postMessage({
                    type: 'error',
                    content: 'reFetchable'
                })
            }, 1000);
        } else {
            if(this.ChatgptPort) {
                if(job.type ==='getSummary') {
                    let cache = await summaryCache.getSummary(job.videoId)
                    if(cache) {
                        port.postMessage({
                            type: 'summary',
                            content: {
                                videoId: job.videoId,
                                message: cache
                            }
                        })
                        return 0;
                    }
                    let setting = await store.getChatgptSetting()
                    const stopIntervalMs = setting.stopIntervalMs || 500
                    const questions =groupSubtitleByCount(job.subtitle,parseFloat(setting.stopCount)).map(x => {
                      return getPrompt(x,parseInt(setting.words),parseFloat(setting.baseTime),parseFloat(setting.step),parseInt(setting.maxCount), parseInt(setting.minCount), parseInt(setting.count))
                    })
                    this.ChatgptPort.postMessage({
                        type: 'getSummary',
                        questions,
                        videoId: job.videoId,
                        force: job.force,
                        timeout: parseInt(setting.timeout),
                        refreshToken: job.refreshToken,
                        stopIntervalMs
                    })
                } else {
                    this.ChatgptPort.postMessage(job)
                }
            } else {
                port.postMessage({
                    type: 'error',
                    content: 'unauthorized'
                })
            }
        }
    }
    bilibiliSummaryPortOnDisconnect(port: Browser.Runtime.Port) {
        port.onDisconnect.addListener(() => {
            this.BilibiliSummaryPort = null
        })
    }
    sendToBilibiliSummaryPort(port: Browser.Runtime.Port) {
        this.ChatgptPort = port;
        port.postMessage({
            type: 'connected'
        })
        port.onMessage.addListener(async (job, port) => {
            if(this.BilibiliSummaryPort) {
                if(job.type === 'summaryFinalCache') {
                    await summaryCache.setSummary(job.content.videoId,job.content.message)
                    this.BilibiliSummaryPort.postMessage(job)
                } else {
                  this.BilibiliSummaryPort.postMessage(job)
                }
            }
        })
        port.onDisconnect.addListener(() => {
            this.ChatgptPort = null
        })
    }
}

const connector = new ChatgptConnector()

Browser.runtime.onConnect.addListener((port) => {
    console.debug('connected', port)
    if (port.name === 'BILIBILISUMMARY') {
        connector.BilibiliSummaryPort = port;
        port.onMessage.addListener(async (job, port) => {
            if(job.type === 'CommonService') {
              const method = job.content.method as keyof typeof commonService
              try {
                // @ts-ignore
                commonService[method]()
              } catch (error) {
                console.error(error)
              }
              return 0;
            }
            let currentType = await store.getType()
            if(currentType === store.openai) {
                let setting = await store.getOpenaiSetting()
                let openaiProvider = new OpenaiProvider(port,setting.apiKey,setting.model,setting.maxTokens)
                openaiProvider.handleJob(job)
            } else {
                connector.sendToChatgptPort(job,port)
            }
        })
        connector.bilibiliSummaryPortOnDisconnect(port)
    } else if (port.name === 'CHATGPT') {
        connector.sendToBilibiliSummaryPort(port)
    }
})