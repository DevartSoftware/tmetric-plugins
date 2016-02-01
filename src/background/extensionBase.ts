const enum ButtonState { start, stop, fixtimer, connect }

class ExtensionBase {

    showLoginDialog() { }

    showError(message: string) { }

    showNotification(message: string, title?: string) { }

    showConfirmation(message: string) {
        return false;
    }

    loadValue(key: string, callback: (value: any) => void) { }

    saveValue(key: string, value: any) { }

    setButtonIcon(icon: string, tooltip: string) { }

    sendToTabs: (message: ITabMessage, tabId?: any) => void;

    openPage(url: string) { }

    buttonState = ButtonState.start;

    private _actionOnConnect: () => void;

    private _urlToIssue = <{ [url: string]: Integrations.WebToolIssue }>{};

    private _timer: Models.Timer;

    private _timeEntries: Models.TimeEntry[];

    private _userProfile: Models.UserProfile;

    private _currentIssue: Integrations.WebToolIssue;

    private _projects: Models.Project[];

    private _tags: Models.Tag[];

    constructor(public port: Firefox.Port) {

        this.port.on('updateTimer', timer => {
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

        this.port.emit('init', trackerServiceUrl);

        this.listenPopupAction<void, IPopupInitData>('initialize', this.initializePopupAction);
        this.listenPopupAction<void, void>('login', this.loginPopupAction);
        this.listenPopupAction<Models.Timer, void>('putTimer', this.putTimerPopupAction);
    }

    /** Handles messages from in-page scripts */
    onTabMessage(message: ITabMessage, tabId: any, isTabActive: boolean) {

        this.sendToTabs({ action: message.action + '_callback' }, tabId);

        switch (message.action) {

            case 'setTabInfo':
                this.setTabIssue(isTabActive, message.data);
                break;

            case 'getTimer':
                this.sendToTabs({ action: 'setTimer', data: this._timer }, tabId);
                break;

            case 'putTimer':
                this.putTabTimer(message.data);
                break;
        }
    }

    setCurrentTab(url: string, title: string) {
        this._currentIssue = this.getTabIssue(url, title);
        this.updateState();
    }

    cleanUpTabInfo(allUrls: string[]) {
        var containsUrl = <{ [url: string]: boolean }>{};
        allUrls.forEach(url => {
            var url = this.normalizeUrl(url);
            if (url) {
                (containsUrl[url] = true)
            }
        });
        for (var url in this._urlToIssue) {
            if (!containsUrl[url]) {
                delete this._urlToIssue[url];
            }
        }
    }

    fixTimer() {
        var url = trackerServiceUrl;
        if (this._userProfile && this._userProfile.activeAccountId) {
            url += '#/tracker/' + this._userProfile.activeAccountId + '/';
        }
        this.openPage(url);
        this.showNotification('You should fix the timer.');
    }

    putPopupTimer(timer: Models.Timer) {
        this.putData(timer, (timer) => {
            return this.putTimer(timer);
        });
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
        var folder = '/'; // Pass folder in ReturnUrl
        var folderIndex = trackerServiceUrl.indexOf('/', 10);
        if (folderIndex > 0) {
            folder = trackerServiceUrl.substring(folderIndex);
        }
        return trackerServiceUrl + 'login';
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
                    if (status.serviceRole < Models.ServiceRole.ProjectCreator || !timer.serviceUrl) {
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
        url = this.normalizeUrl(url);
        return this._urlToIssue[url] || { issueName: title || url };
    }

    private setTabIssue(isTabActive: boolean, tabInfo: ITabInfo) {
        var url = this.normalizeUrl(tabInfo.url);
        var title = tabInfo.title;
        var issue = tabInfo.issue;

        if (issue) {
            this._urlToIssue[url] = issue;
        }
        else {
            delete this._urlToIssue[url];
            issue = { issueName: title || url };
        }

        if (isTabActive) {
            this._currentIssue = issue;
            this.updateState();
        }
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

    private wrapPortAction<TParam, TResult>(actionName: string) {
        var callbackName = actionName + '_callback';
        return (param?: TParam) => new Promise<TResult>((callback, reject) => {
            this.port.once(callbackName, (isFulfilled: boolean, result: any) => {
                if (isFulfilled) {
                    callback(result);
                }
                else {
                    reject(result);
                }
            });
            this.port.emit(actionName, param);
        });
    }

    private disconnect = this.wrapPortAction<void, void>('disconnect');
    private getTimer = this.wrapPortAction<void, void>('getTimer');
    private putTimer = this.wrapPortAction<Models.Timer, void>('putTimer');
    private putTimerWithExistingIntegration = this.wrapPortAction<Integrations.WebToolIssueTimer, void>('putExternalTimer');
    private postIntegration = this.wrapPortAction<Models.IntegratedProjectIdentifier, void>('postIntegration');
    private getIntegration = this.wrapPortAction<Models.IntegratedProjectIdentifier, Models.IntegratedProjectStatus>('getIntegration');
    private setAccountToPost = this.wrapPortAction<number, void>('setAccountToPost');
    protected reconnect = this.wrapPortAction<void, void>('reconnect');

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

    private getPopupData(): IPopupInitData {

        var description: string;
        var projectId: number;
        var tagIds = [];

        if (this._currentIssue && this._currentIssue.serviceType) {
            description = '';
            projectId = this.toProjectId(this._currentIssue && this._currentIssue.projectName);
        }
        else {
            description = this._currentIssue && this._currentIssue.issueName;
            projectId = null;
        }

        return {
            task: { description, projectId, tagIds },
            timer: this._timer,
            projects: this._projects,
            tags: this._tags
        };
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
            if (this._timer) {
                resolve(this.getPopupData());
            } else {
                reject('Not connected');
            }
        });
    }

    loginPopupAction() {
        this.reconnect().catch(() => this.showLoginDialog());
        return Promise.resolve(null);
    }

    putTimerPopupAction(timer: Models.Timer) {
        this.putPopupTimer(timer);
        return Promise.resolve(null);
    }
}