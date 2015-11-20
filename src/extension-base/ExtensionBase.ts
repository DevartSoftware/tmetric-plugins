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

        this.port.emit('init', trackerServiceUrl);
    }

    /** Handles messages from in-page scripts */
    onTabMessage(message: ITabMessage, tabId: any, isTabActive: boolean) {
        if (message.action == 'setTabInfo') {
            this.setTabIssue(isTabActive, message.data);
        }
        else if (message.action == 'getTimer') {
            this.sendToTabs({ action: 'setTimer', data: this._timer }, tabId);
        }
        else if (message.action == 'putTimer') {
            this.startTimer(message.data);
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

    startTimer(url: string, title: string)
    startTimer(timer: Integrations.WebToolIssueTimer)
    startTimer(param1: any, param2?: any) {
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

        var notification: string;

        var action = (showDialog?: boolean, dontCreateIntegration?: boolean) => {
            if (this.buttonState == ButtonState.fixtimer) {
                var url = trackerServiceUrl;
                if (this._userProfile && this._userProfile.activeAccountId) {
                    url += '#/tracker/' + this._userProfile.activeAccountId + '/';
                }
                this.openPage(url);
                this.showNotification('You should fix the timer.');
                return;
            }

            return this.putTimer(timer)
                .then(() => {
                    if (notification) {
                        this.showNotification(notification);
                    }
                })
                .catch((status: AjaxStatus) => {

                    // Zero status when server is unavailable or certificate fails (#59755). Show dialog in that case too.
                    if (!status || status.statusCode == HttpStatusCode.Unauthorized || status.statusCode == 0) {
                        var disconnectPromise = this.disconnect();

                        if (showDialog) {
                            disconnectPromise.then(() => {
                                this._actionOnConnect = () => {
                                    // Do not change task after connect if timer already started
                                    if (this.buttonState == ButtonState.fixtimer || !this._timer || !this._timer.isStarted) {
                                        action();
                                    }
                                };
                                this.showLoginDialog();
                            });
                        };

                        return;
                    }

                    var error = this.getErrorText(status);

                    // Show error and exit when timer has no integration
                    if (dontCreateIntegration ||
                        status.statusCode != HttpStatusCode.Forbidden ||
                        !timer.serviceUrl && !timer.projectName) {
                        this.showError(error);
                        return;
                    }

                    this.getIntegration(<Models.IntegratedProjectIdentifier>{
                        serviceUrl: timer.serviceUrl,
                        serviceType: timer.serviceType,
                        projectName: timer.projectName
                    })
                        .then(status => {

                            if (timer.projectName) {
                                var contactAdmin = 'Please contact the account administrator to fix the problem.';

                                if (!status.projectStatus) {
                                    // No rights to create project or service is not specified
                                    if (status.serviceRole < Models.ServiceRole.ProjectCreator || !timer.serviceUrl) {
                                        timer.projectName = undefined;
                                    }
                                }
                                else if (status.projectStatus != Models.ProjectStatus.Open) {
                                    notification = 'Cannot assign the task to the '
                                    + (status.projectStatus == Models.ProjectStatus.Archived ? 'archived' : 'closed')
                                    + ' project \'' + timer.projectName + '\'.\n\n' + contactAdmin;

                                    timer.projectName = undefined;
                                }
                                else if (status.projectRole == null) {
                                    notification = 'You are not a member of the project \''
                                    + timer.projectName + '\'.\n\n' + contactAdmin;

                                    timer.projectName = undefined;
                                }
                            }

                            if (!timer.serviceUrl == !status.integrationName &&
                                !timer.projectName == !status.projectStatus) {
                                // Project and service are registered or are not specified in timer
                                action(false, true);
                            }
                            else {

                                // Integration or project does not exist
                                this.setAccountToPost(status.accountId)
                                    .then(() => this.postIntegration(<Models.IntegratedProjectIdentifier>{
                                        serviceUrl: timer.serviceUrl,
                                        serviceType: timer.serviceType,
                                        projectName: timer.projectName
                                    }))
                                    .then(() => action(false, true))
                                    .catch(status => {
                                        this.setAccountToPost(null);
                                        this.showError(this.getErrorText(status));
                                    });
                            }
                        })
                        .catch(() => {
                            this.showError(error);
                        });
                });
        };
        action(true);
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
        return trackerServiceUrl + 'Login?ReturnUrl=' + folder + '%23/noapp';
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
    private putTimer = this.wrapPortAction<Integrations.WebToolIssueTimer, void>('putTimer');
    private postIntegration = this.wrapPortAction<Models.IntegratedProjectIdentifier, void>('postIntegration');
    private getIntegration = this.wrapPortAction<Models.IntegratedProjectIdentifier, Models.IntegratedProjectStatus>('getIntegration');
    private setAccountToPost = this.wrapPortAction<number, void>('setAccountToPost');
    protected reconnect = this.wrapPortAction<void, void>('reconnect');
}