/// <reference path="../typings/signalr/signalr" />
/// <reference path="../typings/firefox/firefox" />

class SignalRConnection {
    url: string;

    hub: HubConnection;

    hubProxy: HubProxy;

    hubConnected: boolean;

    userProfile: Models.UserProfile;

    constructor() {
        self.port.once('init', (url: string) => {
            this.url = url;
            this.hub = $.hubConnection(url);
            this.hubProxy = this.hub.createHubProxy('timeTrackerHub');
            this.hubProxy.on('updateTimer', (accountId: number) => {
                if (this.userProfile && accountId != this.userProfile.activeAccountId) {
                    return;
                }

                var previousProfileId = this.userProfile.userProfileId;
                this.getProfile(
                    () => {
                        if (this.userProfile.userProfileId != previousProfileId) {
                            this.disconnect();
                            this.connect();
                        }
                        else {
                            this.getTimer();
                        }
                    });
            });

            this.hubProxy.on('updateActiveAccount', (accountId: number) => {
                if (this.userProfile && accountId != this.userProfile.activeAccountId) {
                    this.disconnect();
                    this.connect();
                }
            });

            this.connect();
        });

        self.port.on('disconnect', () => this.disconnect());

        self.port.on('connect', () => this.connect());

        self.port.on('putTimer', timer => {
            this.putTimer(timer, result => {
                self.port.emit('putTimerCallback', result);
            });
        });

        self.port.on('postIntegration', identifier => {
            this.postIntegration(identifier, result => {
                self.port.emit('postIntegrationCallback', result);
            });
        });

        self.port.on('getIntegration', identifier => {
            this.getIntegration(identifier, result => {
                self.port.emit('getIntegrationCallback', result);
            });
        });
    }

    connect(done?: () => JQueryPromise<any>, fail?: () => void) {
        fail = fail || emptyCallback;

        if (this.hubConnected) {
            if (done) {
                done();
            }
            return;
        }

        this.getProfile(() => {
            this.hub.start().then(() => {
                this.hubConnected = true;
                this.hub.disconnected(() => this.disconnect());
                this.hubProxy.invoke('register', this.userProfile.userProfileId);

                if (done) {
                    done()
                        .then(() => this.getTimer())
                        .fail(fail);
                }
                else {
                    this.getTimer();
                }
            }, fail);
        }, fail);

        function emptyCallback() { }
    }

    disconnect() {
        if (this.hubConnected) {
            this.hubConnected = false;
            self.port.emit('updateTimer', null);
            this.hub.stop(false);
        }
    }

    putTimer(timer: Integrations.WebToolIssueTimer, callback: AjaxCallback<any>) {
        this.connect(
            () => {
                if (!timer.isStarted) {
                    return this.put('api/timer/' + this.userProfile.activeAccountId, <Models.Timer>{ isStarted: false }, callback, callback)
                }
                return this.post('api/timer/external', timer, callback, callback)
            },
            () => this.callFail(callback));
    }

    getIntegration(identifier: Models.IntegratedProjectIdentifier, callback: AjaxCallback<Models.IntegratedProjectStatus>) {
        if (!this.userProfile || !this.userProfile.activeAccountId) {
            this.callFail(callback);
            return;
        }

        this.get<Models.IntegratedProjectStatus>(
            'api/account/' + this.userProfile.activeAccountId + '/integrations/project?' + $.param(identifier, true),
            callback,
            callback);
    }

    postIntegration(identifier: Models.IntegratedProjectIdentifier, callback: AjaxCallback<any>) {
        if (!this.userProfile || !this.userProfile.activeAccountId) {
            this.callFail(callback);
            return;
        }

        this.post<Models.IntegratedProjectIdentifier>(
            'api/account/' + this.userProfile.activeAccountId + '/integrations/project',
            identifier,
            callback,
            callback);
    }

    getProfile(done: () => void, fail?: () => void) {
        this.get<Models.UserProfile>('api/userprofile',
            result => {
                this.userProfile = result.data;
                self.port.emit('updateProfile', result.data);
                done();
            },
            () => {
                this.disconnect();
                if (fail) {
                    fail();
                }
            });
    }

    getTimer() {
        var requestAccountId = this.userProfile.activeAccountId;

        this.get<Models.Timer>('api/timer/' + requestAccountId,
            result => {
                if (this.userProfile.activeAccountId == requestAccountId) {
                    self.port.emit('updateTimer', result.data);
                }
            },
            () => this.disconnect());

        var startTime = new Date();
        startTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
        var endTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate() + 1);

        this.get<Models.TimeEntry[]>('/api/timeentries/' + requestAccountId + '/' + this.userProfile.userProfileId
            + '?startTime=' + startTime.toJSON() + '&endTime=' + endTime.toJSON(),
            result => {
                if (this.userProfile.activeAccountId == requestAccountId) {
                    self.port.emit('updateTracker', result.data);
                }
            },
            () => this.disconnect());
    }

    callFail(fail?: AjaxCallback<any>) {
        if (fail) {
            fail(<AjaxResult<any>>{ statusCode: 0 });
        }
    }

    get<T>(url: string, done?: AjaxCallback<T>, fail?: AjaxCallback<T>): JQueryPromise<T> {
        return this.ajax<T>(url, 'GET', null, done, fail);
    }

    post<T>(url: string, data: T, done?: AjaxCallback<T>, fail?: AjaxCallback<T>): JQueryPromise<T> {
        return this.ajax<T>(url, 'POST', data, done, fail);
    }

    put<T>(url: string, data: T, done?: AjaxCallback<T>, fail?: AjaxCallback<T>): JQueryPromise<T> {
        return this.ajax<T>(url, 'PUT', data, done, fail);
    }

    ajax<T>(url: string, method: string, postData: T, done?: AjaxCallback<T>, fail?: AjaxCallback<T>): JQueryPromise<T> {
        var settings = <JQueryAjaxSettings>{};
        settings.url = this.url + url;

        if (postData) {
            settings.data = JSON.stringify(postData);
            settings.contentType = "application/json";
        }

        if (method == 'GET' || method == 'POST') {
            settings.type = method;
        }
        else {
            settings.type = 'POST';
            settings.headers = {};
            settings.headers['X-HTTP-Method-Override'] = method;
        }

        var xhr = $.ajax(settings);

        xhr.done((data: T) => {
            var result = getResult(postData ? null : data);

            if (xhr.status >= 200 && xhr.status < 300) {
                if (done) {
                    done(result);
                }
            }
            else if (fail) {
                fail(result);
            }
        });

        if (fail) {
            xhr.fail(() => fail(getResult(null)));
        }

        return xhr;

        function getResult(data: T): AjaxResult<T> {
            var statusText = xhr.statusText;
            if (statusText == 'error') // jQuery replaces empty status to 'error'
            {
                statusText = '';
            }
            return { data, statusCode: xhr.status, statusText }
        }
    }
}
new SignalRConnection();