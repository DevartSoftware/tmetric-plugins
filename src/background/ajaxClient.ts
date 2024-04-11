class AjaxClient {

    /** @virtual */
    public ajax<TReq, TRes>(url: string, method: string, dataReq?: TReq): Promise<TRes> {
        return this.ajaxInternal(null, url, method, dataReq);
    }

    protected ajaxInternal<TReq, TRes>(token: string | null, url: string, method: string, dataReq?: TReq): Promise<TRes> {

        const headers = {} as HeadersInit;
        const settings = { headers } as RequestInit;
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        const contentTypeHeader = 'Content-Type';
        const contentTypeJson = 'application/json';

        if (dataReq !== undefined) {
            settings.body = JSON.stringify(dataReq);
            headers[contentTypeHeader] = contentTypeJson;
        }

        if (method == 'GET' || method == 'POST') {
            settings.method = method;
        }
        else {
            settings.method = 'POST';
            headers['X-HTTP-Method-Override'] = method;
        }

        return new Promise<TRes>(async (callback, reject) => {

            const getErrorStatus = (e: any, defaultMessage: string) => {
                let message = (typeof e === 'string') ? e : (e as Object)?.toString?.();
                return { statusCode: 0, responseMessage: message || defaultMessage } as AjaxStatus;
            }

            let res: Response;
            try {
                res = await fetch(url, settings);
            }
            catch (e) {
                reject(getErrorStatus(e, 'Network error'))
                return;
            }

            let json = <any>undefined;
            const contentType = res?.headers?.get(contentTypeHeader);
            if (contentType?.includes(contentTypeJson)) {
                try {
                    json = await res.json();
                }
                catch (e) {
                    reject(getErrorStatus(e, 'Invalid format'))
                    return;
                }
            }

            if (res.status >= 200 && res.status < 400) {
                callback(json);
            } else {
                const statusCode = res.status;
                let responseMessage: string | undefined;
                if (json) {
                    responseMessage = json.message || json.Message;
                }

                let statusText: string | undefined;
                if (statusCode) { // HTTP/2 does not define a way to carry the reason phrase
                    statusText = AjaxClient.statusDescriptions[statusCode];
                }
                reject({ statusCode, statusText, responseMessage } as AjaxStatus);
            }
        });
    }

    private static statusDescriptions = <{ [code: number]: string }>{
        100: "Continue",
        101: "Switching Protocols",
        102: "Processing",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        207: "Multi-Status",
        300: "Multiple Choices",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy",
        307: "Temporary Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Request Entity Too Large",
        414: "Request-Uri Too Long",
        415: "Unsupported Media Type",
        416: "Requested Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        423: "Locked",
        424: "Failed Dependency",
        426: "Upgrade Required",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "Http Version Not Supported",
        507: "Insufficient Storage"
    }
}