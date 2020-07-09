abstract class OidcClient {

    private static authorityUrl;

    public static init(authorityUrl: string) {
        this.authorityUrl = authorityUrl;
    }

    public static isLoggedIn() {
        return Promise.all([
            this.getStorageValue('access_token'),
            this.getStorageValue('refresh_token')
        ]).then(tokens => tokens.every(_ => !!_));
    }

    public static getLoginUrl(): string {
        return `${this.authorityUrl}extension/login.html`;
    }

    public static getTokensByAuthorizationCode(authorizationCode) {

        return new Promise<{ refresh_token, access_token }>((resolve, reject) => {

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${this.authorityUrl}core/connect/token`);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                }
                else {
                    reject(xhr.status);
                }
            }
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(`client_id=browser_extension&grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${this.authorityUrl}extension/callback.html`);
        });
    }

    public static getTokensByRefresh(refreshToken) {

        return new Promise<{ refresh_token, access_token }>((resolve, reject) => {

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${this.authorityUrl}core/connect/token`);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                }
                else {
                    reject(xhr.status);
                }
            }
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(`client_id=browser_extension&grant_type=refresh_token&refresh_token=${refreshToken}&redirect_uri=${this.authorityUrl}extension/callback.html`);
        });
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
                resolve();
            });
        });
    }

    public static async ajax<TReq, TRes>(url, options, dataReq?: TReq): Promise<TRes> {

        // If we have authorization code - get new acces and refresh tokens
        const authorizationCode = await this.getStorageValue('authorization_code');
        if (authorizationCode) {
            await this.setStorageValue('authorization_code', null);
            const tokens = await this.getTokensByAuthorizationCode(authorizationCode);
            if (tokens && tokens.refresh_token && tokens.access_token) {
                await this.setStorageValue('refresh_token', tokens.refresh_token);
                await this.setStorageValue('access_token', tokens.access_token);
                return await this.ajaxInternal<TReq, TRes>(tokens.access_token, url, options, dataReq);
            }
        }

        // Try to connect with presaved acces token
        const accesToken = await this.getStorageValue('access_token');
        if (accesToken) {
            try {
                return await this.ajaxInternal<TReq, TRes>(accesToken, url, options, dataReq);
            }
            catch (error) {
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

        const settings = <JQueryAjaxSettings>{};
        settings.url = url;

        if (dataReq !== undefined) {
            settings.data = JSON.stringify(dataReq);
            settings.contentType = "application/json";
        }

        const isGet = method == 'GET';
        const isPost = method == 'POST';

        settings.headers = {};
        settings.headers['Authorization'] = 'Bearer ' + token;

        if (isGet || isPost) {
            settings.type = method;
        }
        else {
            settings.type = 'POST';
            settings.headers['X-HTTP-Method-Override'] = method;
        }

        return new Promise<TRes>((callback, reject) => {

            const xhr = $.ajax(settings);

            xhr.done(dataRes => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    callback(dataRes);
                }
                else {
                    reject(fail);
                }
            });

            xhr.fail(fail);

            function fail() {
                const statusCode = xhr.status;
                let statusText = xhr.statusText;
                if (xhr.responseJSON) {
                    var responseMessage = xhr.responseJSON.message;
                }

                if (statusText == 'error') // jQuery replaces empty status to 'error'
                {
                    statusText = '';
                }
                if (statusCode && !statusText) { // HTTP/2 does not define a way to carry the reason phrase
                    statusText = ServerConnection.statusDescriptions[statusCode];
                }
                reject(<AjaxStatus>{ statusCode, statusText, responseMessage });
            }
        });
    }
}