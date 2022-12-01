abstract class OidcClient {

    private static authorityUrl;

    public static init(authorityUrl: string) {
        this.authorityUrl = authorityUrl;
    }

    public static neverLoggedIn() {
        return Promise.all([
            this.getStorageValue('access_token'),
            this.getStorageValue('refresh_token')
        ]).then(tokens => tokens.some(_ => !_));
    }

    public static getLoginUrl(): string {
        return `${this.authorityUrl}extension/login.html`;
    }

    private static async getTokensByAuthorizationInternal(body: string) {
        const res = await fetch(`${this.authorityUrl}core/connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': "application/x-www-form-urlencoded"
            },
            body
        })
        if (res.status !== 200) {
            throw res.status;
        }

        const json = (await res.json()) as { refresh_token: string, access_token: string };
        return json;
    }

    public static getTokensByAuthorizationCode(authorizationCode) {
        return this.getTokensByAuthorizationInternal(
            `client_id=browser_extension&grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${this.authorityUrl}extension/callback.html`
        );
    }

    public static async getTokensByRefresh(refreshToken) {
        return this.getTokensByAuthorizationInternal(
            `client_id=browser_extension&grant_type=refresh_token&refresh_token=${refreshToken}&redirect_uri=${this.authorityUrl}extension/callback.html`
        );
    }

    public static getStorageValue(key: string): Promise<string> {
        return new Promise<string>((resolve) => {
            chrome.storage.local.get([key], function (result) {
                resolve(result[key]);
            });
        });
    }

    public static setStorageValue(key: string, value: string) {
        return new Promise((resolve) => {
            const obj = {};
            obj[key] = value;
            chrome.storage.local.set(obj, function () {
                resolve(undefined);
            });
        });
    }

    public static async authorize() {

        // If we have authorization code - get new acces and refresh tokens
        const authorizationCode = await this.getStorageValue('authorization_code');
        if (authorizationCode) {
            await this.setStorageValue('authorization_code', null);
            const tokens = await this.getTokensByAuthorizationCode(authorizationCode);
            if (tokens && tokens.refresh_token && tokens.access_token) {
                await this.setStorageValue('refresh_token', tokens.refresh_token);
                await this.setStorageValue('access_token', tokens.access_token);
                return true;
            }
        }

        return false;
    }

    public static async ajax<TReq, TRes>(url, options, dataReq?: TReq): Promise<TRes> {

        // Try to connect with presaved acces token
        const accessToken = await this.getStorageValue('access_token');
        if (accessToken) {
            try {
                return await this.ajaxInternal<TReq, TRes>(accessToken, url, options, dataReq);
            }
            catch (error) {
                if (error.statusCode != 401) {
                    throw error;
                }
                // Try to get new acces token with presaved refresh token
                const refreshToken = await this.getStorageValue('refresh_token');
                if (refreshToken) {
                    const tokens = await this.getTokensByRefresh(refreshToken);
                    if (tokens && tokens.refresh_token && tokens.access_token) {
                        await this.setStorageValue('refresh_token', tokens.refresh_token);
                        await this.setStorageValue('access_token', tokens.access_token);
                        return await this.ajaxInternal<TReq, TRes>(tokens.access_token, url, options, dataReq);
                    }
                }
            }
        }

        throw 'No credentials to connect';
    }

    private static ajaxInternal<TReq, TRes>(token: string, url: string, method: string, dataReq?: TReq): Promise<TRes> {

        const settings = {
            headers: {
                Authorization: 'Bearer ' + token
            }
        } as RequestInit;

        const contentTypeHeader = 'Content-Type';
        const contentTypeJson = 'application/json';

        if (dataReq !== undefined) {
            settings.body = JSON.stringify(dataReq);
            settings.headers[contentTypeHeader] = contentTypeJson;
        }

        if (method == 'GET' || method == 'POST') {
            settings.method = method;
        }
        else {
            settings.method = 'POST';
            settings.headers['X-HTTP-Method-Override'] = method;
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
                let responseMessage: string;
                if (json) {
                    responseMessage = json.message || json.Message;
                }

                let statusText: string;
                if (statusCode) { // HTTP/2 does not define a way to carry the reason phrase
                    statusText = ServerConnection.statusDescriptions[statusCode];
                }
                reject({ statusCode, statusText, responseMessage } as AjaxStatus);
            }
        });
    }
}