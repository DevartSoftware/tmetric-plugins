class PopupBase {

    constructor() {
        this.initControls();
        this.switchState(this._states.loading);
        this.initializeAction().then((data) => {

            this.setData(data);

            if (data.timer && data.timer.isStarted) {
                if (this.isLongRunning(data.timer.startTime)) {
                    this.fillFixForm(data.timer);
                    this.switchState(this._states.fixing);
                } else {
                    this.fillViewForm(data.timer);
                    this.fillCreateForm(data.title);
                    this.switchState(this._states.viewing);
                }
            } else {
                this.fillCreateForm(data.title);
                this.switchState(this._states.creating);
            }
        }).catch((error) => {
            this.isConnectionRetryEnabledAction().then((retrying) => {
                if (retrying) {
                    this.switchState(this._states.retrying);
                } else {
                    this.switchState(this._states.authenticating);
                }
            });
        });
    }

    private _activeTimer: Models.Timer;
    private _timeFormat: string;
    private _projects: Models.Project[];
    private _tags: Models.Tag[];

    callBackground(message: IPopupRequest): Promise<IPopupResponse> { return; };

    close(): void { }

    setData(data: IPopupInitData) {
        if (data.timer) {
            this._activeTimer = data.timer;
            this._timeFormat = data.timeFormat;
            this._projects = data.projects;
            this._tags = data.tags;
        } else {
            this.close();
        }
    }

    putTimer(timer: Models.Timer) {
        this.putTimerAction(timer);
        this.close();
    }

    private clone(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }

    // actions

    private wrapBackgroundAction<TData, TResult>(action: string) {
        return (data?: TData) => {
            return new Promise<TResult>((resolve, reject) => {
                this.callBackground({
                    action: action,
                    data: data
                }).then((response) => {
                    if (response.error) {
                        reject(response.error);
                    } else {
                        resolve(response.data);
                    }
                }).catch((error) => {
                    reject(<string>error);
                });
            })
        };
    }

    initializeAction = this.wrapBackgroundAction<void, IPopupInitData>('initialize');
    openTrackerAction = this.wrapBackgroundAction<void, void>('openTracker');
    openPageAction = this.wrapBackgroundAction<string, void>('openPage');
    loginAction = this.wrapBackgroundAction<void, void>('login');
    isConnectionRetryEnabledAction = this.wrapBackgroundAction<void, boolean>('isConnectionRetryEnabled');
    retryAction = this.wrapBackgroundAction<void, void>('retry');
    fixTimerAction = this.wrapBackgroundAction<void, void>('fixTimer');
    putTimerAction = this.wrapBackgroundAction<Models.Timer, void>('putTimer');

    // ui mutations

    private _forms = {
        login: '#login-form',
        fix: '#fix-form',
        view: '#view-form',
        create: '#create-form'
    };

    private _messageTypes = {
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    private _states = {
        loading: 'loading',
        retrying: 'retrying',
        authenticating: 'authenticating',
        fixing: 'fixing',
        creating: 'creating',
        viewing: 'viewing'
    };

    private iconIssueIdDomains = {
        'asana.com': true,
        'basecamp.com': true,
        'producteev.com': true,
        'teamweek.com': true,
        'todoist.com': true,
        'uservoice.com': true,
        'wrike.com': true,
        'wunderlist.com': true
    };

    private domainRegExp = /([^\.\/]+\.[^\.\/]+)\//;

    switchState(name: string) {
        $('content').attr('class', name);
        if (name == this._states.creating) {
            this.initCreatingForm();
        }
    }

    fillFixForm(timer: Models.Timer) {
        if (timer && timer.details) {
            $(this._forms.fix + ' .description').text(this.toDescription(timer.details.description));
            $(this._forms.fix + ' .startTime').text(this.toLongRunningDurationString(timer.startTime));
        }
    }

    fillViewForm(timer: Models.Timer) {

        let details = timer && timer.details;
        if (!details) {
            return
        }

        $(this._forms.view + ' .time').text(this.toDurationString(timer.startTime));

        var url = this.getTaskUrl(timer.details);
        if (url && details.projectTask && details.projectTask.externalIssueId) {
            let issueIdText = details.projectTask.externalIssueId;
            let domainMatch = this.domainRegExp.exec(url);
            if (domainMatch && this.iconIssueIdDomains[domainMatch[1]]) {
                issueIdText = '\u29C9'; // "Two joined squares" symbol
            }
            $(this._forms.view + ' .task .id .link').attr('href', url).text(issueIdText);
        } else {
            $(this._forms.view + ' .task .id').hide();
        }

        $(this._forms.view + ' .task .name').text(this.toDescription(details.description));

        if (details.projectId) {
            $(this._forms.view + ' .project .name').text(this.toProjectName(details.projectId)).show();
        } else {
            $(this._forms.view + ' .project').hide();
        }

        if (timer.tagsIdentifiers && timer.tagsIdentifiers.length) {
            $(this._forms.view + ' .tags .items').text(this.makeTimerTagsText(timer.tagsIdentifiers)).show();
        } else {
            $(this._forms.view + ' .tags').hide();
        }
    }

    fillCreateForm(description: string) {
        $(this._forms.create + ' .task .input').val(description).focus().select();
        this.setSelectValue(this._forms.create + ' .project .input', { data: this.makeProjectSelectData() }, '');
        this.setSelectValue(this._forms.create + ' .tags .input', { data: this.makeTagSelectData() }, '');
    }

    initCreatingForm() {
        $(this._forms.create + ' .task .input').focus().select();
    }

    fillTaskTimer(selector: string, timer: Models.Timer) {
        timer.details = timer.details || <Models.TimeEntryDetail>{};
        timer.details.description = $(selector + ' .task .input').val();
        timer.details.projectId = parseInt(this.getSelectValue(selector + ' .project .input')) || null;
        timer.tagsIdentifiers = (this.getSelectValue(selector + ' .tags .input') || []).map(tag => parseInt(tag));
        var project = this.getProject(timer.details.projectId);
        timer.isBillable = project ? project.isBillable : false;
    }

    getTaskUrl(details: Models.TimeEntryDetail) {
        let task = details && details.projectTask;
        if (task && task.integrationUrl && task.relativeIssueUrl) {
            return task.integrationUrl + task.relativeIssueUrl;
        }
        return '';
    }

    private _weekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    private _monthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');

    getDuration(startTime: Date | string) {
        var startDate = startTime instanceof Date ? startTime : new Date(<string>startTime);
        var result = new Date().getTime() - startDate.getTime();
        return result > 0 ? result : 0;
    }

    toDurationString(startTime: string) {

        var MINUTE = 1000 * 60;
        var HOUR = MINUTE * 60;

        var duration = this.getDuration(startTime);
        var hours = Math.floor(duration / HOUR);
        var minutes = Math.floor((duration - hours * HOUR) / MINUTE);

        var result = [];
        if (hours) {
            result.push(hours + ' h');
        }
        result.push(minutes + ' min');

        return result.join(' ');
    }

    isLongRunning(startTime: string) {

        var HOUR = 1000 * 60 * 60;
        var LONG_RUNNING_DURATION = 10 * HOUR;

        var duration = this.getDuration(startTime);

        return duration >= LONG_RUNNING_DURATION;
    }

    toLongRunningDurationString(startTime: string) {

        var duration = this.getDuration(startTime);

        var now = new Date();

        var durationToday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        var durationYesterday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

        var startDate = new Date(startTime);

        // Output:
        // Started Wed, 03 Feb at 15:31
        var result = '';
        if (duration <= durationToday) {
            result = 'Started today';
        } else if (duration <= durationYesterday) {
            result = 'Started yesterday';
        } else {
            result = 'Started ' + this._weekdaysShort[startDate.getDay()] + ', ' + startDate.getDate() + ' ' + this._monthsShort[startDate.getMonth()];
        }

        var hours = startDate.getHours();
        var minutes = startDate.getMinutes();

        if (this._timeFormat == 'H:mm') {
            result += ' at ' + hours + ':' + (minutes < 10 ? '0' + minutes : minutes);
        } else {
            var period: string;
            if (hours >= 12) {
                period = 'pm';
                hours -= 12;
            } else {
                period = 'am';
            }
            result += ' at ' + (hours == 0 ? 12 : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + period;
        }

        return result;
    }

    toDescription(description: string) {
        return description || '(No description)';
    }

    toProjectName(projectId: number): string {
        var name = '';
        if (this._projects) {
            var projects = this._projects.filter((project) => {
                return project.projectId === projectId;
            });
            if (projects.length) {
                name = projects[0].projectName;
            }
        }
        return name;
    }

    toProjectId(projectName: string): number {
        var id = null;
        if (this._projects) {
            var projects = this._projects.filter((project) => {
                return project.projectName === projectName;
            });
            if (projects.length) {
                id = projects[0].projectId;
            }
        }
        return id;
    }

    getProject(id: number): Models.Project {
        var project = null;
        if (this._projects) {
            var projects = this._projects.filter((project) => {
                return project.projectId === id;
            });
            if (projects.length) {
                project = projects[0];
            }
        }
        return project;
    }

    getTag(id: number): Models.Tag {
        var tag = null;
        if (this._tags) {
            var tags = this._tags.filter((tag) => {
                return tag.tagId === id;
            });
            if (tags.length) {
                tag = tags[0];
            }
        }
        return tag;
    }

    makeTimerTagsText(timerTags: number[]) {
        return timerTags.map((id) => {
            var tag = this.getTag(id);
            return tag ? tag.tagName : '';
        }).join(', ');
    }

    private _noProjectOption: IdTextPair = { id: 0, text: 'No Project' };

    makeProjectSelectData() {
        return [this._noProjectOption].concat(this._projects.map((project) => {
            return { id: project.projectId, text: project.projectName };
        }));
    }

    makeTagSelectData() {
        return this._tags.map((tag) => {
            return { id: tag.tagId, text: tag.tagName };
        });
    }

    getSelectValue(selector: string) {
        return $(selector).select().val();
    }

    setSelectValue(selector: string, options: Select2Options, value: string | string[]) {
        $(selector).select2(options).val(value).trigger("change");
    }

    // ui event handlers

    initControls() {

        $('#site-link').click(() => this.onSiteLinkClick());
        $('#task-link').click(() => this.onTaskLinkClick());
        $('#login').click(() => this.onLoginClick());
        $('#retry').click(() => this.onRetryClick());
        $('#fix').click(() => this.onFixClick());
        $('#start').click(() => this.onStartClick());
        $('#stop').click(() => this.onStopClick());
        $('#create-link').click(() => this.onCreateClick());

        // close popup when escape key pressed and no selectors are opened
        window.addEventListener('keydown', (event) => {
            if (event.keyCode == 27) {
                if (!$('body > .select2-container').length) {
                    this.close();
                }
            }
        }, true);
    }

    private onSiteLinkClick() {
        this.openTrackerAction();
        this.close();
    }

    private onTaskLinkClick() {
        var url = this.getTaskUrl(this._activeTimer.details);
        if (url) {
            this.openPageAction(url);
            this.close();
        }
    }

    private onLoginClick() {
        this.loginAction();
        this.close();
    }

    private onRetryClick() {
        this.retryAction();
        this.close();
    }

    private onFixClick() {
        this.fixTimerAction();
        this.close();
    }

    private onStartClick() {
        var timer = <Models.Timer>{};
        var now = new Date();
        timer.isStarted = true;
        timer.startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toJSON();
        this.fillTaskTimer(this._forms.create, timer);
        this.putTimer(timer);
    }

    private onStopClick() {
        var timer = this.clone(this._activeTimer);
        timer.isStarted = false;
        this.putTimer(timer);
    }

    private onCreateClick() {
        this.switchState(this._states.creating);
    }
}