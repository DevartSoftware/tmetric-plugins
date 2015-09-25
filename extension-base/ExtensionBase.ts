/// <reference path="HttpStatusCode" />

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

    actionOnConnect: () => void;

    sendToTabs: (message: ITabMessage, tabId?: any) => void;

    openPage(url: string) { }

    buttonState = ButtonState.start;

    private _urlToIssue = <{ [url: string]: Integrations.WebToolIssue }>{};

    private _timer: Models.Timer;

    private _timeEntries: Models.TimeEntry[];

    private _userProfile: Models.UserProfile;

    private _currentIssue: Integrations.WebToolIssue;

    constructor(public url: string, public port: Firefox.Port) {
        // this.url = 'http://localhost:65341/';

        this.port.on('updateTimer', timer => this.setTimer(timer));
        this.port.on('updateTracker', timeEntries => this.setTracker(timeEntries));
        this.port.on('updateProfile', profile => this.setProfile(profile));
        this.port.emit('init', this.url);
    }

    /** Handles page messages (from page.js) */
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
                var url = this.url;
                if (this._userProfile && this._userProfile.ActiveAccountId) {
                    url += '#/tracker/' + this._userProfile.ActiveAccountId + '/';
                }
                this.openPage(url);
                this.showNotification('You should fix the timer.');
                return;
            }

            this.port.once('putTimerCallback', (status: AjaxResult<any>) => {
                if (status.statusCode >= 200 && status.statusCode < 400) {
                    if (notification) {
                        this.showNotification(notification);
                    }
                    return;
                }

                // Zero status when server is unavailable or certificate fails (#59755). Show dialog in that case too.
                if (status.statusCode == HttpStatusCode.Unauthorized || status.statusCode == 0) {
                    this.port.emit('disconnect');

                    if (showDialog) {
                        this.actionOnConnect = action;
                        this.showLoginDialog();
                    }
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

                var postIntegration = (done: () => void) => {
                    this.port.once('postIntegrationCallback', (result: AjaxResult<any>) => {
                        if (result.statusCode < 200 || result.statusCode >= 400) {
                            this.showError(this.getErrorText(result));
                        }
                        else {
                            done();
                        }
                    });
                    this.port.emit('postIntegration', <Models.IntegratedProjectIdentifier>{
                        serviceUrl: timer.serviceUrl,
                        serviceType: timer.serviceType,
                        projectName: timer.projectName
                    });
                };

                this.port.once('getIntegrationCallback', (statusResult: AjaxResult<Models.IntegratedProjectStatus>) => {
                    var status = statusResult.data || <Models.IntegratedProjectStatus>{};

                    if (!statusResult.statusCode || statusResult.statusCode < 200 || statusResult.statusCode >= 400) {
                        this.showError(error);
                        return;
                    }

                    if (timer.projectName) {
                        var contactAdmin = 'Please contact the account administrator to fix the problem.';

                        if (!status.ProjectStatus) {
                            // No rights to create project or service is not specified
                            if (status.ServiceRole < Models.ServiceRole.ProjectCreator || !timer.serviceUrl) {
                                timer.projectName = undefined;
                            }
                        }
                        else if (status.ProjectStatus != Models.ProjectStatus.Open) {
                            notification = 'Cannot assign the task to the '
                            + (status.ProjectStatus == Models.ProjectStatus.Archived ? 'archived' : 'closed')
                            + ' project \'' + timer.projectName + '\'.\n\n' + contactAdmin;

                            timer.projectName = undefined;
                        }
                        else if (status.ProjectRole == null) {
                            notification = 'You are not a member of the project \''
                            + timer.projectName + '\'.\n\n' + contactAdmin;

                            timer.projectName = undefined;
                        }
                    }

                    if (!timer.serviceUrl == !status.IntegrationName &&
                        !timer.projectName == !status.ProjectStatus) {
                        // Project and service are registered or are not specified in timer
                        action(false, true);
                    }
                    else {
                        // Integration or project does not exist
                        postIntegration(() => action(false, true));
                    }
                });
                this.port.emit('getIntegration', <Models.IntegratedProjectIdentifier>{
                    serviceUrl: timer.serviceUrl,
                    serviceType: timer.serviceType,
                    projectName: timer.projectName
                });
            });

            this.port.emit('putTimer', timer);
        };
        action(true);
    }

    updateState() {
        var state = ButtonState.connect;
        var text = 'Not Connected';
        if (this._timer) {
            if (this._timer.IsStarted) {
                if (this.getDuration(this._timer) > 10 * 60 * 60000) {
                    state = ButtonState.fixtimer;
                    text = 'Started (Need User Action)\n'
                    + 'It looks like you forgot to stop the timer';
                }
                else {
                    state = ButtonState.stop;
                    text = 'Started\n'
                    + (this._timer.WorkTask.Description || '(No task description)');
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

    private setTimer(timer: Models.Timer) {
        this._timer = timer;
        this.updateState();
        this.sendToTabs({ action: 'setTimer', data: timer });
    }

    private setTracker(timeEntries: Models.TimeEntry[]) {
        this._timeEntries = timeEntries;
        this.updateState();
    }

    private setProfile(profile: Models.UserProfile) {
        this._userProfile = profile;
    }

    private getDuration(timer: Models.Timer): number
    private getDuration(timeEntries: Models.TimeEntry[]): number
    private getDuration(arg: any): any {
        if (arg) {
            var now = new Date().getTime();
            if ((<Models.TimeEntry[]>arg).reduce) {
                return (<Models.TimeEntry[]>arg).reduce((duration, entry) => {
                    var startTime = Date.parse(entry.StartTime);
                    var endTime = entry.EndTime ? Date.parse(entry.EndTime) : now;
                    return duration + (endTime - startTime);
                }, 0);
            }
            else if ((<Models.Timer>arg).IsStarted) {
                return now - Date.parse((<Models.Timer>arg).StartTime);
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

    private getErrorText(status: AjaxResult<any>) {
        return '' + (status.statusText || status.statusCode || 'Connection to the server failed or was aborted.');
    }
}