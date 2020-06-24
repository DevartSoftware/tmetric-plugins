abstract class CustomOidc {

    private static authority = "http://local.tmetric.com:30100";
    public static isCodeRequestInProgress = false;

    private static delay = millis => new Promise((resolve) => {
        setTimeout(_ => resolve(), millis)
    });

    public static async getCodeRequest() {

        if (this.isCodeRequestInProgress)
            return;
        this.isCodeRequestInProgress = true;
        window.open(`${this.authority}/extension/login.html`);
    }

    public static getTokensByCode(code) {

        return new Promise<{ refresh_token, access_token }>((resolve, reject) => {

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${this.authority}/core/connect/token`);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                }
                else {
                    reject(xhr.status);
                }
            }
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(`client_id=browser_extension&grant_type=authorization_code&code=${code}&redirect_uri=${this.authority}/extension/callback.html`);
        });
    }

    public static getTokensByRefresh(refreshToken) {

        return new Promise<{ refresh_token, access_token }>((resolve, reject) => {

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${this.authority}/core/connect/token`);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                }
                else {
                    reject(xhr.status);
                }
            }
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(`client_id=browser_extension&grant_type=refresh_token&refresh_token=${refreshToken}&redirect_uri=${this.authority}/extension/callback.html`);
        });
    }

    public static getStorageValue(key: string): Promise<string> {
        return new Promise<string>((resolve) => {
            chrome.storage.sync.get([key], function (result) {
                resolve(result[key]);
            });
        });
    }

    public static setStorageValue(key: string, value: string) {
        return new Promise((resolve) => {
            const obj = {};
            obj[key] = value;
            chrome.storage.sync.set(obj, function () {
                resolve();
            });
        });
    }

    public static async ajax<TReq, TRes>(url, options, dataReq?: TReq): Promise<TRes> {

        // Try to connect with presaved acces token
        let accesToken = await this.getStorageValue('acces_token');
        if (accesToken) {
            try {
                return await this.ajaxInternal<TReq, TRes>(accesToken, url, options, dataReq);
            }
            catch (error) {
                // Will try to reconnect on the next step
            }
        }

        // Try to get new acces token with presaved refresh token
        const refreshToken = await this.getStorageValue('refresh_token');
        if (refreshToken) {
            const tokens = await this.getTokensByRefresh(refreshToken);
            if (tokens && tokens.refresh_token && tokens.access_token) {
                await this.setStorageValue('refresh_token', tokens.refresh_token);
                await this.setStorageValue('acces_token', tokens.access_token);
                try {
                    return await this.ajaxInternal<TReq, TRes>(accesToken, url, options, dataReq);
                }
                catch (error) {
                    // Will try to reconnect on the next step
                }
            }
        }

        // Try to get new acces and refresh tokens with user login form
        await this.getCodeRequest();
        do {
            await this.delay(100);
            accesToken = await this.getStorageValue('acces_token');
        } while (this.isCodeRequestInProgress);

        return await this.ajaxInternal<TReq, TRes>(accesToken, url, options, dataReq);
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

(async function () {

    const div = document.getElementById('code');
    const code = div.innerText;
    div.innerText = ''; // Say page to close itself

    const tokens = await CustomOidc.getTokensByCode(code);
    if (tokens && tokens.refresh_token && tokens.access_token) {
        await CustomOidc.setStorageValue('refresh_token', tokens.refresh_token);
        await CustomOidc.setStorageValue('acces_token', tokens.access_token);
    }
        
    CustomOidc.isCodeRequestInProgress = false;
})();
