class SignalRConnection {

    url: string;

    hub: HubConnection;

    hubProxy: HubProxy;

    hubConnected: boolean;

    userProfile: Models.UserProfile;

    accountToPost: number;

    retryInProgress: boolean;

    retryTimeout: number;

    retryPendingHandle: number;

    retryTimeStamp = new Date();

    expectedTimerUpdate = false;

    constructor() {
        self.port.once('init', (url: string) => {
            this.url = url;
            this.hub = $.hubConnection(url);

            this.hub.disconnected(() => {
                this.expectedTimerUpdate = false;
                console.log('disconnected');
                this.disconnect().then(() => {
                    this.setRetryPending(true);
                });
            });

            this.hubProxy = this.hub.createHubProxy('timeTrackerHub');

            this.hubProxy.on('updateTimer', (accountId: number) => {
                if (this.userProfile && accountId != this.userProfile.activeAccountId) {
                    return;
                }

                console.log('updateTimer: ' + this.expectedTimerUpdate);

                if (this.expectedTimerUpdate) {
                    this.expectedTimerUpdate = false;
                    this.getTimer();
                }
                else {
                    // timer changed from outside - check that profile still the same
                    this.isProfileChanged().then(isProfileChanged => {
                        if (isProfileChanged) {
                            this.reconnect();
                        }
                        else {
                            this.getTimer();
                        }
                    });
                }
            });

            this.hubProxy.on('updateActiveAccount', (accountId: number) => {
                if (!this.userProfile || accountId != this.userProfile.activeAccountId) {
                    this.reconnect();
                }
            });

            this.hubProxy.on('updateProjects', (accountId: number) => {
                if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                    this.getProjects();
                }
            });

            this.hubProxy.on('updateTags', (accountId: number) => {
                if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                    this.getTags();
                }
            });

            this.reconnect().catch(() => { });
        });

        this.listenPortAction<void>('disconnect', this.disconnect);
        this.listenPortAction<void>('reconnect', this.reconnect);
        this.listenPortAction<void>('isConnectionRetryEnabled', this.isConnectionRetryEnabled);
        this.listenPortAction<Integrations.WebToolIssueTimer>('getTimer', this.getTimer);
        this.listenPortAction<Models.Timer>('putTimer', this.putTimer);
        this.listenPortAction<Integrations.WebToolIssueTimer>('putExternalTimer', this.putExternalTimer);
        this.listenPortAction<Models.IntegratedProjectIdentifier>('postIntegration', this.postIntegration);
        this.listenPortAction<Models.IntegratedProjectIdentifier>('getIntegration', this.getIntegration);
        this.listenPortAction<number>('setAccountToPost', this.setAccountToPost);
        this.listenPortAction<void>('retryConnection', this.retryConnection);
    }

    isProfileChanged() {
        let previousProfileId = this.userProfile && this.userProfile.userProfileId;
        return this.getProfile().then(profile => profile.userProfileId != previousProfileId);
    }

    checkProfileChange() {
        this.isProfileChanged().then(isProfileChanged => {
            if (isProfileChanged) {
                this.reconnect();
            }
        });
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
        console.log('reconnect');
        return this.disconnect()
            .then(() => this.connect())
            .then(() => this.getTimer())
    }

    setRetryPending(isRetryPending: boolean) {

        if (!!this.retryPendingHandle == isRetryPending) {
            return;
        }

        if (isRetryPending) {
            var timeout = this.retryTimeout;
            var fromPreviousRetry = new Date().getTime() - this.retryTimeStamp.getTime();
            if (!timeout || fromPreviousRetry > 5 * 60000) {
                timeout = 30000; // Start from 30 second interval when reconnected more than 5 mins ago
            }
            else {
                timeout = Math.min(timeout * 1.25, 90000); // else increase interval up to 1.5 mins
            }
            this.retryTimeout = timeout;
            timeout *= 1 + Math.random(); // Random for uniform server load
            //timeout = 3000; // for dev

            this.retryPendingHandle = setTimeout(() => this.retryConnection(), timeout);
        }
        else if (this.retryPendingHandle) {
            clearTimeout(this.retryPendingHandle);
            this.retryPendingHandle = null;
        }
    };

    retryConnection() {
        this.setRetryPending(false);
        if (!this.hubConnected && !this.retryInProgress) {
            this.retryInProgress = true;
            this.reconnect()
                .catch((err: AjaxStatus) => {
                    // Stop retrying when server returns error code
                    if (!(err.statusCode > 0)) {
                        this.setRetryPending(true);
                    }
                })
                .then(() => this.retryInProgress = false);
        }
        return Promise.resolve();
    }

    isConnectionRetryEnabled() {
        return Promise.resolve(!!(this.retryPendingHandle || this.retryInProgress));
    }

    connect() {
        console.log('connect');
        return new Promise<Models.UserProfile>((callback, reject) => {
            if (this.hubConnected) {
                callback(this.userProfile);
                return;
            }

            this.getProfile().then((profile) => {
                Promise.all<any>([this.getProjects(), this.getTags()]).then(([projects, tags]) => {
                    this.hub.start().then(() => {
                        //this.hub['disconnectTimeout'] = 1000; // for dev
                        this.hubConnected = true;
                        this.setRetryPending(false);
                        this.hubProxy.invoke('register', profile.userProfileId)
                            .then(() => callback(profile))
                            .fail(reject);
                    }).fail(reject);
                }).catch(reject);
            }).catch(reject);
        });
    }

    disconnect() {
        return new Promise<void>((callback, reject) => {
            if (this.hubConnected) {
                this.hubConnected = false;
                self.port.emit('updateTimer', null);
                this.hub.stop(false);
            }
            this.setRetryPending(false);
            callback();
        });
    }

    putTimer(timer: Models.Timer) {
        return this.connect().then(profile => {
            var accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;
            return this.put('api/timer/' + accountId, timer)
                .then(() => {
                    this.checkProfileChange();
                })
                .catch(() => {
                    this.expectedTimerUpdate = false;
                });
        });
    }

    putExternalTimer(timer: Integrations.WebToolIssueTimer) {

        if (!timer.isStarted) {
            return this.putTimer(<Models.Timer>{ isStarted: false });
        }

        return this.connect().then(profile => {
            let accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;
            return this.post('api/timer/external/' + accountId, timer)
                .then(() => {
                    this.checkProfileChange();
                })
                .catch(() => {
                    this.expectedTimerUpdate = false;
                });
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

    getProjects() {
        return this.checkProfile().then(profile => {
            var url = 'api/accounts/' + profile.activeAccountId + '/projects';
            return this.get<Models.Project[]>(url).then(projects => {
                self.port.emit('updateProjects', projects);
                return projects;
            });
        });
    }

    getTags() {
        return this.checkProfile().then(profile => {
            var url = 'api/accounts/' + profile.activeAccountId + '/tags';
            return this.get<Models.Tag[]>(url).then(tags => {
                self.port.emit('updateTags', tags);
                return tags;
            });
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