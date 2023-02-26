class HI {
    constructor(s) {
        this.chatService = s
    }
    baseUrl = "https://chat.openai.com/backend-api";
    taskMap = {};
    modelName = null;
    async getToken() {
        let s = await fetch("https://chat.openai.com/api/auth/session");
        if (s.status === 403)
            throw "CLOUDFLARE";
        let f = await s.json();
        if (f.accessToken)
            return f.accessToken;
        throw "UNAUTHORIZED"
    }
    async fetchModels(s) {
        return (await this.fetch({
            method: "GET",
            path: `${this.baseUrl}/models`,
            headers: this.getRequestHeader(s)
        })).models
    }
    async feedback(s, f) {
        return await this.fetch({
            method: "POST",
            path: `${this.baseUrl}/conversation/message_feedback`,
            headers: this.getRequestHeader(s),
            data: f
        })
    }
    cancelTask(s, f) {
        let h = this.taskMap[f.taskId];
        !h || (h.abortController.abort(),
        delete this.taskMap[h.taskId])
    }
    async getAnswer(s, f) {
        let h = new Ut
          , d = new AbortController
          , w = {
            taskId: f.taskId,
            abortController: d,
            conversationId: f.conversationId
        };
        return this.doGetAnswer({
            token: s,
            taskInfo: w,
            params: f,
            resp: h
        }).catch(I=>{
            h.onData?.(null, !0, I)
        }
        ),
        h
    }
    async deleteConversation(s, f) {
        let {conversationId: h} = f;
        for (let I of Object.keys(this.taskMap))
            this.taskMap[I].conversationId === h && this.cancelTask(s, {
                taskId: I
            });
        let w = (await this.chatService.getChatGptConversationMap())[h];
        if (!w)
            throw "CONVERSATION_NOT_FOUND";
        return this.chatService.removeChatGptConversationData(h),
        await this.fetch({
            path: `${this.baseUrl}/conversation/${w.chatGptConvId}`,
            method: "PATCH",
            headers: this.getRequestHeader(s),
            data: {
                isVisible: !1
            }
        })
    }
    async doGetAnswer(s) {
        let {token: f, taskInfo: h, params: d, resp: w} = s;
        this.taskMap[h.taskId] = h;
        let I = null
          , M = ie.genId();
        await this.fetchCompletions({
            question: d,
            messageId: M,
            token: f,
            taskInfo: h,
            onMessage: L=>{
                if (L === "[DONE]") {
                    this.chatService.getChatGptConversationMap().then(B=>{
                        ws.log("chat gpt resp msg:", {
                            ...I,
                            chatGptConvId: B[d.conversationId].chatGptConvId
                        })
                    }
                    ),
                    w.onData?.(I, !0),
                    this.cancelTask(f, {
                        taskId: h.taskId
                    });
                    return
                }
                try {
                    let B = ie.camelize(JSON.parse(L))
                      , X = B.message?.content?.parts?.[0];
                    X && (this.chatService.getChatGptConversationMap().then(O=>{
                        let Q = d.conversationId;
                        O[Q] || this.chatService.addChatGptConversationData(Q, {
                            chatGptConvId: B.conversationId,
                            createdAt: Date.now()
                        })
                    }
                    ),
                    I = {
                        content: X,
                        parentMessageId: M,
                        type: "answer",
                        messageId: B.message.id,
                        conversationId: d.conversationId
                    },
                    w.onData?.(I, !1))
                } catch (B) {
                    ws.error("unsupported streaming msg:", B)
                }
            }
        })
    }
    async getModelName(s) {
        try {
            if (!this.modelName) {
                let f = await this.fetchModels(s);
                this.modelName = f[0].slug
            }
            return this.modelName
        } catch (f) {
            return ws.error(f),
            "text-davinci-002-render-sha"
        }
    }
    getRequestHeader(s) {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${s}`
        }
    }
    async fetchCompletions(s) {
        let {onMessage: f, taskInfo: h, question: d, messageId: w, token: I} = s
          , M = await this.chatService.getChatGptConversationMap()
          , L = await this.getModelName(I)
          , B = M[d.conversationId]
          , X = h.abortController.signal;
        if (X.aborted)
            return;
        let O = await this.fetch({
            method: "POST",
            path: `${this.baseUrl}/conversation`,
            headers: this.getRequestHeader(I),
            returnOriginResponse: !0,
            signal: h.abortController.signal,
            data: {
                action: "next",
                messages: [{
                    id: w,
                    role: "user",
                    content: {
                        contentType: "text",
                        parts: [d.content]
                    }
                }],
                conversationId: B ? B.chatGptConvId : void 0,
                model: L,
                parentMessageId: d.parentMessageId || ie.genId()
            }
        });
        if (!O.ok) {
            let$ = await O.json().catch();
            throw this.openApiErrorHandler($)
        }
        let Q = pu($=>{
            $.type === "event" && f($.data)
        }
        )
          , z = O.body.getReader();
        try {
            for (; !X.aborted; ) {
                let {done: $, value: se} = await z.read();
                if ($)
                    return;
                let ve = new TextDecoder().decode(se);
                Q.feed(ve)
            }
        } catch {
            z.releaseLock()
        }
    }
    async fetch(s) {
        let f = ie.underlize(s.data)
          , h = await fetch(s.path, {
            method: s.method,
            headers: s.headers,
            body: f == null ? void 0 : JSON.stringify(f),
            signal: s.signal
        });
        if (h.status === 403)
            throw "CLOUDFLARE";
        if (s.returnOriginResponse)
            return h;
        if (h.ok) {
            let w = await h.json();
            return ie.camelize(w)
        }
        let d = await h.json().catch(()=>({}));
        throw s.errorHandler ? s.errorHandler(d) : this.openApiErrorHandler(d)
    }
    openApiErrorHandler(s) {
        let f = s.detail;
        return f ? typeof f == "string" ? f.includes("Too many requests") ? "TOO_MANY_REQUESTS" : f.includes("Unauthorized") ? "UNAUTHORIZED" : f.includes("Not Found") ? "OPENAI_NOT_FOUND" : f : f.message ? f.message : "UNKNOWN" : "UNKNOWN"
    }
}
;
var Qe = yn(xn(), 1)
  , Fr = Ce.getLogger("ChatService")
  , Tm = 3600 * 1e3 * 72
  , Ur = class {
    constructor(s, f) {
        this.storage = s;
        this.service = f;
        this.init().then(()=>{
            this.chatGptRequester = new Gr(this.service)
        }
        ).catch(h=>{
            Fr.error("ChatGptProvider init error", h)
        }
        )
    }
    currentSenderPort;
    get currentSenderTabId() {
        return this.currentSenderPort?.sender?.tab?.id
    }
    pendingRequests = {};
    chatGptRequester;
    conversationMap;
    initReady = !1;
    events = new Br;
    async init() {
        this.storage.removeDeprecated("chatGpt"),
        this.conversationMap = await this.loadConversationMap(),
        await this.removeOutdatedConversations(),
        rn.isProd && this.initRequestSenderForProd(),
        Qe.default.runtime.onConnect.addListener(s=>{
            s.name === "ChatGptRequestSender" && (Fr.log("ChatGptRequestSender connected"),
            this.currentSenderPort && this.disposeCurrentSenderPort(),
            this.currentSenderPort = s,
            s.onMessage.addListener(f=>{
                this.pendingRequests[f.reqId](f)
            }
            ),
            s.onDisconnect.addListener(()=>{
                s === this.currentSenderPort && (this.currentSenderPort = void 0)
            }
            ))
        }
        ),
        this.initReady = !0,
        this.events.emit("initReady")
    }
    async loadConversationMap() {
        let s = await this.storage.get("chatGptConversationMap");
        return s || Fr.error("No conversationMap when init"),
        s || {}
    }
    initRequestSenderForProd() {
        this.searchAndInsertRequestSender(),
        Qe.default.tabs.onUpdated.addListener((s,f)=>{
            Qe.default.tabs.get(s).then(h=>{
                this.isTargetHost(h.url) && f.status === "complete" && (this.disposeCurrentSenderPort(),
                this.insertScriptToTab(s))
            }
            )
        }
        ),
        Qe.default.tabs.onRemoved.addListener(s=>{
            s === this.currentSenderTabId && (this.disposeCurrentSenderPort(),
            this.searchAndInsertRequestSender())
        }
        )
    }
    async createConversation() {
        return `conv:${ie.genId()}`
    }
    async addConversationData(s, f) {
        this.conversationMap[s] = f,
        await this.saveConversationMap()
    }
    async removeConversationData(s) {
        delete this.conversationMap[s],
        await this.saveConversationMap()
    }
    async feedback(s) {
        return this.callRequestMethod("feedback", s)
    }
    async deleteConversation(s) {
        return this.callRequestMethod("deleteConversation", {
            conversationId: s
        })
    }
    cancelTask(s) {
        return this.callRequestMethod("cancelTask", {
            taskId: s
        })
    }
    getAnswer(s, f) {
        let h = `task:${ie.genId()}`;
        return (async()=>{
            let w = await sn.get("language");
            s.parentMessageId || (s.content = ie.addPromptLangSuffix(s.content, w)),
            this.callRequestMethod("getAnswer", {
                taskId: h,
                ...s
            }, f)
        }
        )(),
        {
            taskId: h
        }
    }
    hasChatGptTab() {
        return !!this.currentSenderPort?.sender?.tab
    }
    focusChatGptTab(s=!1) {
        if (!this.hasChatGptTab())
            return !1;
        let f = this.currentSenderPort.sender.tab;
        return Qe.default.windows.update(f.windowId, {
            focused: !0
        }),
        Qe.default.tabs.update(f.id, {
            active: !0
        }),
        s && Qe.default.tabs.reload(f.id),
        !0
    }
    createChatGptTab() {
        return Qe.default.windows.create({
            url: "https://chat.openai.com/chat",
            type: "normal",
            width: 200,
            focused: !0
        }),
        !0
    }
    async getConversationMap() {
        return this.initReady ? this.conversationMap : new Promise(s=>{
            this.events.once("initReady", ()=>{
                s(this.conversationMap)
            }
            )
        }
        )
    }
    async saveConversationMap() {
        return this.storage.update({
            chatGptConversationMap: this.conversationMap
        })
    }
    isTargetHost(s) {
        return s?.includes("https://chat.openai.com")
    }
    isTargetTab(s) {
        return this.isTargetHost(s.url) && s.id
    }
    disposeCurrentSenderPort() {
        this.currentSenderPort && (this.currentSenderPort.disconnect(),
        this.currentSenderPort = void 0)
    }
    searchAndInsertRequestSender() {
        this.currentSenderPort || Qe.default.tabs.query({}).then(s=>{
            for (let f of s)
                if (this.isTargetTab(f)) {
                    this.insertScriptToTab(f.id);
                    break
                }
        }
        )
    }
    async insertScriptToTab(s) {
        Qe.default.scripting.executeScript({
            target: {
                tabId: s
            },
            files: ["entries/chatGptInjection.js"]
        }),
        Qe.default.scripting.insertCSS({
            target: {
                tabId: s
            },
            files: ["entries/chatGptInjection.css"]
        })
    }
    async callRequestMethod(s, f, h) {
        if (this.currentSenderPort) {
            let d = ie.genId();
            return new Promise((w,I)=>{
                this.pendingRequests[d] = L=>{
                    let {respType: B, data: X, finished: O, error: Q} = L;
                    B === "data" ? (h?.(X, O, this.normalizeError(Q)),
                    O && (w(null),
                    delete this.pendingRequests[d])) : B === "resp" ? (w(X),
                    delete this.pendingRequests[d]) : (I(X),
                    delete this.pendingRequests[d])
                }
                ;
                let M = {
                    event: "callMethod",
                    reqId: d,
                    data: {
                        method: s,
                        params: f
                    }
                };
                this.currentSenderPort.postMessage(M)
            }
            ).catch(w=>{
                throw h?.(null, !0, this.normalizeError(w)),
                w
            }
            )
        } else
            try {
                let d = await this.getTokenFromCache()
                  , w = await this.chatGptRequester[s](d, f);
                return w instanceof Ut ? (w.onData = (I,M,L)=>{
                    h?.(I, M, this.normalizeError(L))
                }
                ,
                null) : w
            } catch (d) {
                throw h?.(null, !0, this.normalizeError(d)),
                d
            }
    }
    normalizeError(s) {
        return s === void 0 ? s : (Fr.error(s, JSON.stringify(s)),
        typeof s == "string" ? s : "UNKNOWN_OPENAI_ERROR")
    }
    async getTokenFromCache() {
        let s = await this.storage.get("chatGptToken");
        if (s)
            return s;
        let f = await this.chatGptRequester.getToken();
        return await this.storage.update({
            chatGptToken: f
        }),
        f
    }
    async removeOutdatedConversations() {
        let s = this.conversationMap
          , f = Date.now();
        for (let h of Object.keys(s)) {
            let {createdAt: d=0} = s[h];
            f - d > Tm && delete s[h]
        }
        await this.saveConversationMap()
    }
}