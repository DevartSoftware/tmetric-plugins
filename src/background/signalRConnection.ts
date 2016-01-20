class SignalRConnection {

    url: string;

    hub: HubConnection;

    hubProxy: HubProxy;

    hubConnected: boolean;

    userProfile: Models.UserProfile;

    accountToPost: number;

    constructor() {
        self.port.once('init', (url: string) => {
            this.url = url;
            this.hub = $.hubConnection(url);
            this.hubProxy = this.hub.createHubProxy('timeTrackerHub');

            this.hubProxy.on('updateTimer', (accountId: number) => {
                if (this.userProfile && accountId != this.userProfile.activeAccountId) {
                    return;
                }
                var previousProfileId = this.userProfile && this.userProfile.userProfileId;
                this.getProfile().then(profile => {
                    if (profile.userProfileId != previousProfileId) {
                        this.reconnect();
                    }
                    else {
                        this.getTimer();
                    }
                });
            });

            this.hubProxy.on('updateActiveAccount', (accountId: number) => {
                if (!this.userProfile || accountId != this.userProfile.activeAccountId) {
                    this.reconnect();
                }
            });

            this.reconnect().catch(() => { });
        });

        this.listenPortAction<void>('disconnect', this.disconnect);
        this.listenPortAction<void>('reconnect', this.reconnect);
        this.listenPortAction<Integrations.WebToolIssueTimer>('getTimer', this.getTimer);
        this.listenPortAction<Integrations.WebToolIssueTimer>('putTimer', this.putTimer);
        this.listenPortAction<Models.IntegratedProjectIdentifier>('postIntegration', this.postIntegration);
        this.listenPortAction<Models.IntegratedProjectIdentifier>('getIntegration', this.getIntegration);
        this.listenPortAction<number>('setAccountToPost', this.setAccountToPost);
    }

    listenPortAction<TParam>(actionName: string, action: (param: TParam) => Promise<any>) {
        action = action.bind(this);
        var callbackName = actionName + '_callback';
        self.port.on(actionName, (param: TParam) => {
            action(param)
                .then(result => {
                    self.port.emit(callbackName, true, result);
                })
                .catch(error => {
                    self.port.emit(callbackName, false, error);
                });
        });
    }

    reconnect() {
        return this.disconnect()
            .then(() => this.connect())
            .then(() => this.getTimer());
    }

    connect() {
        return new Promise<Models.UserProfile>((callback, reject) => {
            if (this.hubConnected) {
                callback(this.userProfile);
                return;
            }
            this.getProfile()
                .then(profile => {
                    this.hub.start()
                        .then(() => {
                            this.hubConnected = true;
                            this.hub.disconnected(() => this.disconnect());
                            this.hubProxy.invoke('register', profile.userProfileId)
                                .then(() => callback(profile))
                                .fail(reject);
                        })
                        .fail(reject);
                })
                .catch(reject);
        });
    }

    disconnect() {
        return new Promise<void>((callback, reject) => {
            if (this.hubConnected) {
                this.hubConnected = false;
                self.port.emit('updateTimer', null);
                this.hub.stop(false);
            }
            callback();
        });
    }

    putTimer(timer: Integrations.WebToolIssueTimer) {
        return this.connect().then(profile => {
            var accountId = this.accountToPost || profile.activeAccountId;
            if (timer.isStarted) {
                return this.post('api/timer/external/' + accountId, timer)
            }
            return this.put('api/timer/' + accountId, <Models.Timer>{ isStarted: false })
        });
    }

    getIntegration(identifier: Models.IntegratedProjectIdentifier) {
        return this.checkProfile().then(profile =>
            this.get<Models.IntegratedProjectStatus>(
                'api/account/' + profile.activeAccountId + '/integrations/project?' + $.param(identifier, true)));
    }

    postIntegration(identifier: Models.IntegratedProjectIdentifier) {
        return this.checkProfile().then(profile =>
            this.post<Models.IntegratedProjectIdentifier>(
                'api/account/' + (this.accountToPost || profile.activeAccountId) + '/integrations/project',
                identifier));
    }

    setAccountToPost(accountId: number) {
        return new Promise<void>(callback => {
            this.accountToPost = accountId;
            callback();
        });
    }

    checkProfile() {
        return new Promise<Models.UserProfile>((callback, reject) => {
            var profile = this.userProfile;
            if (profile && profile.activeAccountId) {
                callback(profile);
            }
            else {
                reject();
            }
        });
    }

    getProfile() {
        var profile = this.get<Models.UserProfile>('api/userprofile').then(profile => {
            this.userProfile = profile;
            self.port.emit('updateProfile', profile);
            return profile;
        });
        profile.catch(() => this.disconnect());
        return profile;
    }

    getTimer() {
        return this.checkProfile().then(profile => {

            var accountId = profile.activeAccountId;
            var userProfileId = profile.userProfileId;

            var url = 'api/timer/' + accountId;
            var timer = this.get<Models.Timer>(url).then(timer => {
                self.port.emit('updateTimer', timer);
                return timer;
            });

            var now = new Date();
            var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toJSON();
            var endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toJSON();
            url = '/api/timeentries/' + accountId + '/' + userProfileId + '?startTime=' + startTime + '&endTime=' + endTime;
            var tracker = this.get<Models.TimeEntry[]>(url).then(tracker => {
                self.port.emit('updateTracker', tracker);
                return tracker;
            });

            var all = Promise.all<any>([timer, tracker]).then(() => <void>undefined);
            all.catch(() => this.disconnect());
            return all;
        });
    }

    get<T>(url: string): Promise<T> {
        return this.ajax(url, 'GET');
    }

    post<T>(url: string, data: T): Promise<void> {
        return this.ajax(url, 'POST', data);
    }

    put<T>(url: string, data: T): Promise<void> {
        return this.ajax(url, 'PUT', data);
    }

    ajax(url: string, method: string, postData?: any) {
        var settings = <JQueryAjaxSettings>{};
        settings.url = this.url + url;

        if (postData !== undefined) {
            settings.data = JSON.stringify(postData);
            settings.contentType = "application/json";
        }

        var isGet = method == 'GET';
        var isPost = method == 'POST';

        if (isGet || isPost) {
            settings.type = method;
        }
        else {
            settings.type = 'POST';
            settings.headers = {};
            settings.headers['X-HTTP-Method-Override'] = method;
        }

        return new Promise<any>((callback, reject) => {

            var xhr = $.ajax(settings);

            xhr.done(data => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    callback(isGet ? data : undefined);
                }
                else {
                    reject(fail);
                }
            });

            xhr.fail(fail);

            function fail() {
                var statusCode = xhr.status;
                var statusText = xhr.statusText;
                if (statusText == 'error') // jQuery replaces empty status to 'error'
                {
                    statusText = '';
                }
                reject(<AjaxStatus>{ statusCode, statusText });
            }
        });
    }
}
new SignalRConnection();