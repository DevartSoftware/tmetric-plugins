const enum ButtonState { start, stop, fixtimer, connect }

class ExtensionBase {

    showLoginDialog() { }

    showError(message: string) { }

    showNotification(message: string, title?: string) { }

    showConfirmation(message: string) {
        return false;
    }

    setButtonIcon(icon: string, tooltip: string) { }

    sendToTabs: (message: ITabMessage, tabId?: any) => void;

    openPage(url: string) { }

    getActiveTabTitle: () => Promise<string>;

    getTestValue(name: string): any { }

    buttonState = ButtonState.start;

    protected serviceUrl: string;

    protected extraHours: number;

    private _actionOnConnect: () => void;

    private _timer: Models.Timer;

    private _timeEntries: Models.TimeEntry[];

    private _userProfile: Models.UserProfile;

    private _projects: Models.Project[];

    private _tags: Models.Tag[];

    private currentApiVersion = 1.0;

    private defaultApplicationUrl = 'https://app.tmetric.com/';

    constructor(public port: Firefox.Port) {
        this.serviceUrl = this.getTestValue('tmetric.url') || this.defaultApplicationUrl;
        if (this.serviceUrl[this.serviceUrl.length - 1] != '/') {
            this.serviceUrl += '/';
        }
        this.extraHours = this.getTestValue('tmetric.extraHours');
        if (this.extraHours) {
            this.extraHours = parseFloat(<any>this.extraHours);
        }
        else {
            this.extraHours = 0;
        }

        this.port.on('updateTimer', timer => {

            // looks like disconnect
            if (timer == null) {
                this.clearIssuesDurationsCache();
            }

            this._timer = timer;
            this.updateState();
            this.sendToTabs({ action: 'setTimer', data: timer });

            // timer should be received from server on connect
            if (timer) {
                var action = this._actionOnConnect;
                if (action) {
                    this._actionOnConnect = null;
                    action();
                }
            }
        });

        this.port.on('updateTracker', timeEntries => {
            this._timeEntries = timeEntries;
            this.updateState();
        });

        this.port.on('updateProfile', profile => {
            this._userProfile = profile;
        });

        this.port.on('updateProjects', projects => {
            this._projects = projects;
        });

        this.port.on('updateTags', tags => {
            this._tags = tags;
        });

        this.port.on('updateActiveAccount', acountId => {
            this.clearIssuesDurationsCache();
        });

        this.port.on('removeExternalIssuesDurations', identifiers => {
            this.removeIssuesDurationsFromCache(identifiers);
        });

        this.init(this.serviceUrl).then(() => {
            if (this.serviceUrl != this.defaultApplicationUrl) {
                this.getVersion().then(version => {
                    if (this.currentApiVersion > version) {
                        this.showNotification("You are connected to the outdated TMetric server. Extension may not function correctly. Please contact your system administrator.");
                    }
                });
            }
        });

        this.listenPopupAction<void, IPopupInitData>('initialize', this.initializePopupAction);
        this.listenPopupAction<void, void>('openTracker', this.openTrackerPagePopupAction);
        this.listenPopupAction<string, void>('openPage', this.openPagePopupAction);
        this.listenPopupAction<void, boolean>('isConnectionRetryEnabled', this.isConnectionRetryEnabledPopupAction);
        this.listenPopupAction<void, void>('retry', this.retryConnectionPopupAction);
        this.listenPopupAction<void, void>('login', this.loginPopupAction);
        this.listenPopupAction<void, void>('fixTimer', this.fixTimerPopupAction);
        this.listenPopupAction<Models.Timer, void>('putTimer', this.putTimerPopupAction);
    }

    /** Handles messages from in-page scripts */
    onTabMessage(message: ITabMessage, tabId: any) {

        this.sendToTabs({ action: message.action + '_callback' }, tabId);

        switch (message.action) {

            case 'getTimer':
                this.sendToTabs({ action: 'setTimer', data: this._timer }, tabId);
                break;

            case 'putTimer':
                this.putTabTimer(message.data);
                break;

            case 'getIssuesDurations':
                this.getIssuesDurations(message.data).then(durations => {

                    // show extra time on link for test purposes
                    if (this.extraHours && this._timer && this._timer.isStarted) {
                        let activeTask = this._timer.workTask;
                        if (activeTask) {
                            for (let i = 0; i < durations.length; i++) {
                                let duration = durations[i];
                                if (duration.issueUrl == activeTask.relativeIssueUrl && duration.serviceUrl == activeTask.integrationUrl) {
                                    duration = JSON.parse(JSON.stringify(duration));
                                    duration.duration += this.extraHours * 3600000;
                                    durations[i] = duration;
                                    break;
                                }
                            }
                        }
                    }

                    this.sendToTabs({ action: 'setIssuesDurations', data: durations }, tabId);
                });
                break;
        }
    }

    openTrackerPage() {
        var url = this.serviceUrl;
        if (this._userProfile && this._userProfile.activeAccountId) {
            url += '#/tracker/' + this._userProfile.activeAccountId + '/';
        }
        this.openPage(url);
    }

    fixTimer() {
        this.openTrackerPage();
        this.showNotification('You should fix the timer.');
    }

    putTabTimer(url: string, title: string)
    putTabTimer(timer: Integrations.WebToolIssueTimer)
    putTabTimer(param1: any, param2?: any) {

        var timer: Integrations.WebToolIssueTimer;
        if (typeof param1 !== 'string') {
            timer = <Integrations.WebToolIssueTimer>param1;
        }
        else {
            var url = this.normalizeUrl(param1);
            var issue = this.getTabIssue(url, param2);

            timer = <Integrations.WebToolIssueTimer>{ isStarted: this.buttonState != ButtonState.stop };
            for (var i in issue) {
                timer[i] = issue[i];
            }
        }

        this.putData(timer,
            timer => this.putTimerWithExistingIntegration(timer),
            timer => {
                // Show error and exit when timer has no integration
                if (timer.serviceUrl || timer.projectName) {
                    return this.putTimerWithNewIntegration(timer)
                }
            });
    }

    putData<T>(data: T, action: (data: T) => Promise<any>, retryAction?: (data: T) => Promise<any>) {

        var onFail = (status: AjaxStatus, showDialog: boolean) => {

            this._actionOnConnect = null;

            // Zero status when server is unavailable or certificate fails (#59755). Show dialog in that case too.
            if (!status || status.statusCode == HttpStatusCode.Unauthorized || status.statusCode == 0) {

                var disconnectPromise = this.disconnect();

                if (showDialog) {
                    disconnectPromise.then(() => {
                        this._actionOnConnect = () => onConnect(false);
                        this.showLoginDialog();
                    });
                };
            }
            else {

                let error = this.getErrorText(status);

                if (status.statusCode == HttpStatusCode.Forbidden && retryAction) {
                    let promise = retryAction(data);
                    if (promise) {
                        promise.catch(() => this.showError(error));
                        return;
                    }
                }

                this.showError(error);
            }
        };

        var onConnect = (showDialog: boolean) => {

            if (this.buttonState == ButtonState.fixtimer) {

                // ensure connection before page open to prevent login duplication (#67759)
                this._actionOnConnect = () => this.fixTimer();
                this.getTimer().catch(status => onFail(status, showDialog));
                return;
            }

            action(data).catch(status => onFail(status, showDialog));
        };

        if (this._timer == null) {
            // connect before action to get actual state
            this._actionOnConnect = () => onConnect(true);
            this.reconnect().catch(status => onFail(status, true));
        }
        else {
            onConnect(true);
        }
    }

    updateState() {
        var state = ButtonState.connect;
        var text = 'Not Connected';
        if (this._timer) {
            if (this._timer.isStarted) {
                if (this.getDuration(this._timer) > 10 * 60 * 60000) {
                    state = ButtonState.fixtimer;
                    text = 'Started (Need User Action)\n'
                        + 'It looks like you forgot to stop the timer';
                }
                else {
                    state = ButtonState.stop;
                    text = 'Started\n'
                        + (this._timer.workTask.description || '(No task description)');
                }
            }
            else {
                state = ButtonState.start;
                text = 'Paused';
            }
            text += '\nToday Total - '
                + this.durationToString(this.getDuration(this._timeEntries))
                + ' hours';
        }
        this.buttonState = state;
        this.setButtonIcon(state == ButtonState.stop || state == ButtonState.fixtimer ? 'active' : 'inactive', text);
    }

    getLoginUrl(): string {
        return this.serviceUrl + 'login';
    }

    private putTimerWithNewIntegration(timer: Integrations.WebToolIssueTimer) {

        return this.getIntegration(<Models.IntegratedProjectIdentifier>{
            serviceUrl: timer.serviceUrl,
            serviceType: timer.serviceType,
            projectName: timer.projectName
        }).then(status => {

            var notification: string;

            if (timer.projectName) {
                const contactAdmin = 'Please contact the account administrator to fix the problem.';

                if (!status.projectStatus) {
                    // No rights to create project or service is not specified
                    if (status.serviceRole < Models.ServiceRole.ProjectCreator) {
                        timer.projectName = undefined;
                    }
                }
                else if (status.projectStatus != Models.ProjectStatus.Open) {
                    var statusText = status.projectStatus == Models.ProjectStatus.Archived ? 'archived' : 'readonly';
                    notification = `Cannot assign the task to the ${statusText} project '${timer.projectName}'.\n\n${contactAdmin}`;
                    timer.projectName = undefined;
                }
                else if (status.projectRole == null) {
                    notification = `You are not a member of the project '${timer.projectName}.\n\n${contactAdmin}`
                    timer.projectName = undefined;
                }
            }

            var promise = this.setAccountToPost(status.accountId);

            if (!timer.serviceUrl != !status.integrationName ||
                !timer.projectName != !status.projectStatus) {

                // Integration or project does not exist
                promise = promise.then(() => this.postIntegration(<Models.IntegratedProjectIdentifier>{
                    serviceUrl: timer.serviceUrl,
                    serviceType: timer.serviceType,
                    projectName: timer.projectName
                }));
            }

            promise = promise
                .then(() => this.putTimerWithExistingIntegration(timer))
                .then(() => {
                    if (notification) {
                        this.showNotification(notification);
                    }
                })
                .catch(status => {
                    this.showError(this.getErrorText(status));
                })
                .then(() => {
                    this.setAccountToPost(null);
                });

            return promise;
        });
    }

    private normalizeUrl(url: string) {
        if (url) {
            var i = url.indexOf('#');
            if (i > 0) {
                url = url.substring(0, i);
            }
        }
        return url;
    }

    private getTabIssue(url: string, title: string): Integrations.WebToolIssue {
        return { issueName: title || this.normalizeUrl(url) };
    }

    private getDuration(timer: Models.Timer): number
    private getDuration(timeEntries: Models.TimeEntry[]): number
    private getDuration(arg: any): any {
        if (arg) {
            var now = new Date().getTime();
            if ((<Models.TimeEntry[]>arg).reduce) {
                return (<Models.TimeEntry[]>arg).reduce((duration, entry) => {
                    var startTime = Date.parse(entry.startTime);
                    var endTime = entry.endTime ? Date.parse(entry.endTime) : now;
                    return duration + (endTime - startTime);
                }, 0);
            }
            else if ((<Models.Timer>arg).isStarted) {
                return now - Date.parse((<Models.Timer>arg).startTime);
            }
        }
        return 0;
    }

    private durationToString(duration: number) {
        duration = Math.floor(duration / 60000);
        var s = '' + Math.floor(duration / 60) + ':';
        var mins = duration % 60;
        if (mins < 10) {
            s += '0';
        }
        s += mins;
        return s;
    }

    private getErrorText(status: AjaxStatus) {
        var result = status && (status.statusText || status.statusCode);
        if (result) {
            return result.toString();
        }
        return 'Connection to the server failed or was aborted.';
    }

    // issues durations cache

    private _issuesDurationsCache: { [key: string]: Integrations.WebToolIssueDuration } = {};

    private makeIssueDurationKey(identifier: Integrations.WebToolIssueIdentifier): string {
        return identifier.serviceUrl + '/' + identifier.issueUrl;
    }

    private getIssueDurationFromCache(identifier: Integrations.WebToolIssueIdentifier): Integrations.WebToolIssueDuration {
        return this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
    }

    private getIssuesDurationsFromCache(identifiers: Integrations.WebToolIssueIdentifier[]): Integrations.WebToolIssueDuration[] {
        var durations = [];
        identifiers.forEach(identifier => {
            var duration = this.getIssueDurationFromCache(identifier);
            if (duration) {
                durations.push(duration);
            }
        });
        return durations;
    }

    private putIssueDurationToCache(duration: Integrations.WebToolIssueDuration) {
        this._issuesDurationsCache[this.makeIssueDurationKey(duration)] = duration;
    }

    private putIssuesDurationsToCache(durations: Integrations.WebToolIssueDuration[]) {
        durations.forEach(duration => this.putIssueDurationToCache(duration));
    }

    private removeIssueDurationFromCache(identifier: Integrations.WebToolIssueIdentifier) {
        delete this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
    }

    private removeIssuesDurationsFromCache(identifiers: Integrations.WebToolIssueIdentifier[]) {
        identifiers.forEach(identifier => this.removeIssueDurationFromCache(identifier));
    }

    private removeTimerIssueDurationFromCache(timer: Models.Timer) {
        var task = timer && timer.workTask;
        if (task) {
            var identifier = <Integrations.WebToolIssueIdentifier>{
                serviceUrl: task.integrationUrl,
                issueUrl: task.relativeIssueUrl
            };
            this.removeIssueDurationFromCache(identifier);
        }
    }

    private clearIssuesDurationsCache() {
        this._issuesDurationsCache = {};
    }

    getIssuesDurations(identifiers: Integrations.WebToolIssueIdentifier[]): Promise<Integrations.WebToolIssueDuration[]> {
        var durations = <Integrations.WebToolIssueDuration[]>[];
        var fetchIdentifiers = <Integrations.WebToolIssueIdentifier[]>[];
        identifiers.forEach(identifier => {
            var duration = this.getIssueDurationFromCache(identifier);
            if (duration) {
                durations.push(duration);
            } else {
                fetchIdentifiers.push(identifier);
            }
        });

        if (durations.length == identifiers.length) {
            return Promise.resolve(durations);
        } else {
            return new Promise(resolve => {
                this.fetchIssuesDurations(fetchIdentifiers).then(fetchDurations => {
                    this.putIssuesDurationsToCache(fetchDurations);
                    resolve(this.getIssuesDurationsFromCache(identifiers));
                }, () => {
                    resolve([]);
                });
            });
        }
    }

    // port actions

    private wrapPortAction<TParam, TResult>(actionName: string) {
        var actionId = 0;
        return (param?: TParam) => new Promise<TResult>((callback, reject) => {
            var callbackName = actionName + '_' + ++actionId + '_callback';
            this.port.once(callbackName, (isFulfilled: boolean, result: any) => {
                if (isFulfilled) {
                    callback(result);
                }
                else {
                    reject(result);
                }
            });
            this.port.emit(actionName, actionId, param);
        });
    }

    protected reconnect = this.wrapPortAction<void, void>('reconnect');
    private init = this.wrapPortAction<string, void>('init');
    private disconnect = this.wrapPortAction<void, void>('disconnect');
    private retryConnection = this.wrapPortAction<void, void>('retryConnection');
    private isConnectionRetryEnabled = this.wrapPortAction<void, boolean>('isConnectionRetryEnabled');
    private getTimer = this.wrapPortAction<void, void>('getTimer');
    private getVersion = this.wrapPortAction<void, number>('getVersion');
    private putTimer = this.wrapPortAction<Models.Timer, void>('putTimer');
    private putTimerWithExistingIntegration = this.wrapPortAction<Integrations.WebToolIssueTimer, void>('putExternalTimer');
    private postIntegration = this.wrapPortAction<Models.IntegratedProjectIdentifier, void>('postIntegration');
    private getIntegration = this.wrapPortAction<Models.IntegratedProjectIdentifier, Models.IntegratedProjectStatus>('getIntegration');
    private setAccountToPost = this.wrapPortAction<number, void>('setAccountToPost');
    private fetchIssuesDurations = this.wrapPortAction<Integrations.WebToolIssueIdentifier[], Integrations.WebToolIssueDuration[]>('fetchIssuesDurations');

    // popup action listeners

    private _popupActions = {};

    listenPopupAction<TParams, TResult>(action: string, handler: (TParams) => Promise<TResult>) {
        this._popupActions[action] = handler;
    }

    onPopupRequest(request: IPopupRequest, callback: (response: IPopupResponse) => void) {
        var action = request.action;
        var handler = this._popupActions[action];
        if (action && handler) {
            handler.call(this, request.data).then((result: IPopupInitData) => {
                callback({ action: action, data: result });
            }).catch((error) => {
                callback({ action: action, error: error || 'Error' });
            });
        } else {
            callback({ action: action, error: 'Not found handler for action ' + action });
        }
    }

    // popup actions

    private getPopupData(): Promise<IPopupInitData> {
        return new Promise((resolve, reject) => {
            this.getActiveTabTitle().then((title) => {
                resolve({
                    title: title,
                    timer: this._timer,
                    timeFormat: this._userProfile && this._userProfile.timeFormat,
                    projects: this._projects
                        .filter(project => project.projectStatus == Models.ProjectStatus.Open)
                        .sort((a, b) => a.projectName.localeCompare(b.projectName, [], { sensitivity: 'base' })),
                    tags: this._tags
                });
            });
        });
    }

    private toProjectId(projectName: string) {
        var id = null;
        if (this._projects) {
            var projects = this._projects.filter(project => project.projectName === projectName);
            if (projects.length) {
                id = projects[0].projectId;
            }
        }
        return id;
    };

    private toProjectName(projectId: number) {
        var name = '';
        if (this._projects) {
            var projects = this._projects.filter(project => project.projectId === projectId);
            if (projects.length) {
                name = projects[0].projectName;
            }
        }
        return name;
    };

    initializePopupAction(): Promise<IPopupInitData> {
        return new Promise((resolve, reject) => {
            // Forget about old action when user open popup again
            this._actionOnConnect = null;
            if (this._timer) {
                resolve(this.getPopupData());
            } else {
                reject('Not connected');
            }
        });
    }

    openTrackerPagePopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    openPagePopupAction(url) {
        return Promise.resolve(null).then(() => {
            this.openPage(url);
        });
    }

    isConnectionRetryEnabledPopupAction(): Promise<boolean> {
        return this.isConnectionRetryEnabled();
    }

    retryConnectionPopupAction() {
        return this.retryConnection();
    }

    loginPopupAction() {
        return Promise.resolve(null).then(() => {
            this.reconnect().catch(() => this.showLoginDialog());
        });
    }

    fixTimerPopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }

    putTimerPopupAction(timer: Models.Timer) {
        return Promise.resolve(null).then(() =>
            this.putData(timer, timer => this.putTimer(timer)));
    }
}