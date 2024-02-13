class OidcClient extends AjaxClient {

    private readonly _authorityUrl: Promise<string>;

    constructor(authorityUrl: Promise<string>) {
        super();
        this._authorityUrl = authorityUrl;
    }

    public neverLoggedIn() {
        return Promise.all([
            this.getStorageValue('access_token'),
            this.getStorageValue('refresh_token')
        ]).then(tokens => tokens.some(_ => !_));
    }

    private async getTokensByAuthorizationInternal(authorityUrl: string, body: string) {
        const res = await fetch(`${authorityUrl}core/connect/token`, {
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

    private async getTokensByAuthorizationCode(authorizationCode) {
        const authorityUrl = await this._authorityUrl;
        return await this.getTokensByAuthorizationInternal(
            authorityUrl,
            `client_id=browser_extension&grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${authorityUrl}extension/callback.html`);
    }

    private async getTokensByRefresh(refreshToken) {
        const authorityUrl = await this._authorityUrl;
        return await this.getTokensByAuthorizationInternal(
            authorityUrl,
            `client_id=browser_extension&grant_type=refresh_token&refresh_token=${refreshToken}&redirect_uri=${authorityUrl}extension/callback.html`);
    }

    private getStorageValue(key: string): Promise<string | null> {
        return new Promise<string>((resolve) => {
            browser.storage.local.get([key], function (result) {
                resolve(result[key]);
            });
        });
    }

    private setStorageValue(key: string, value: string | null) {
        return new Promise((resolve) => {
            const obj = {};
            obj[key] = value;
            browser.storage.local.set(obj, function () {
                resolve(undefined);
            });
        });
    }

    public async authorize() {

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

    public override async ajax<TReq, TRes>(url: string, method: string, dataReq?: TReq): Promise<TRes> {

        // Try to connect with presaved acces token
        const accessToken = await this.getStorageValue('access_token');
        if (accessToken) {
            try {
                return await this.ajaxInternal<TReq, TRes>(accessToken, url, method, dataReq);
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
                        return await this.ajaxInternal<TReq, TRes>(tokens.access_token, url, method, dataReq);
                    }
                }
            }
        }

        throw 'No credentials to connect';
    }
}