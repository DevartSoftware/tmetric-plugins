class PopupBase {

    constructor() {
        this.initControls();
        this.switchState(this._states.loading);
        this.initializeAction().then((data) => {
            this.setData(data);
            if (this.isStarted()) {
                this.updateView();
                this.switchState(this._states.viewing);
            } else {
                this.updateCreate();
                this.switchState(this._states.creating);
            }
        }).catch((error) => {
            this.switchState(this._states.authenticating);
        });
    }

    private _issue: Integrations.WebToolIssue;
    private _timer: Models.Timer;
    private _projects: Models.Project[];
    private _tags: Models.Tag[];

    callBackground(message: IPopupRequest): Promise<IPopupResponse> { return; };

    close(): void { }

    setData(data: IPopupData) {
        if (data.timer) {
            this._issue = data.issue;
            this._timer = data.timer;
            this._projects = data.projects;
            this._tags = data.tags;
        } else {
            this.close();
        }
    }

    isStarted() {
        return this._timer && this._timer.isStarted;
    }

    updateTimer(timer: Integrations.WebToolIssueTimer) {
        this.switchState(this._states.loading);
        this.updateTimerAction(timer);
        this.close();
    }

    makeTimer(issue: Integrations.WebToolIssue, started: boolean) {

        var timer = <Integrations.WebToolIssueTimer>JSON.parse(JSON.stringify(issue));

        timer.isStarted = started;
        timer.issueName = $('#task').val();

        var projectOptions = $('#project').prop('selectedOptions');
        if (projectOptions && projectOptions.length) {
            timer.projectName = projectOptions[0].textContent;
        }

        return timer;
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

    initializeAction = this.wrapBackgroundAction<void, IPopupData>('initialize');
    loginAction = this.wrapBackgroundAction<void, void>('login');
    updateTimerAction = this.wrapBackgroundAction<Integrations.WebToolIssueTimer, IPopupData>('updateTimer');

    // ui mutations

    private _states = {
        blank: 'blank',
        loading: 'loading',
        authenticating: 'authenticating',
        creating: 'creating',
        viewing: 'viewing',
        editing: 'editing'
    };

    switchState(name: string) {
        $('content').attr('class', name);
    }

    updateView() {

        var task = this._timer && this._timer.workTask;

        if (task) {
            $('#view-form .time .value').text(this.getDuration(this._timer.startTime));
            $('#view-form .task .value').text(task.description);
            $('#view-form .project .value').text(this.getProjectName(task.projectId));
            $('#view-form .tags .value').text(this.makeTagText());
        }
    }

    getDuration(startTime: string) {

        var MINUTE = 1000 * 60;
        var HOUR = MINUTE * 60;
        var DAY = HOUR * 24;

        var start = new Date(startTime).getTime();
        var now = new Date().getTime();

        var duration = Math.abs(start - now);

        var days = Math.floor(duration / DAY);
        var hours = Math.floor((duration - days * DAY) / HOUR);
        var minutes = Math.floor((duration - days * DAY - hours * HOUR) / MINUTE);

        var daysStr = days > 0 ? (days + (days == 1 ? ' day' : ' days')) : '';
        var hoursStr = hours > 0 ? (hours + (hours == 1 ? ' hour' : ' hours')) : '';
        var minutesStr = minutes > 0 ? (minutes + (minutes == 1 ? ' min' : ' mins')) : '';

        var result = daysStr;
        result = result ? result + ' ' + hoursStr : hoursStr;
        result = result ? result + ' ' + minutesStr : minutesStr;
        result = result ? result : '< 1 min';

        return result;
    }

    getProjectName(projectId: number) {
        var name = '';
        if (this._projects) {
            var projects = this._projects.filter((project) => {
                return project.projectId == projectId;
            });
            if (projects.length) {
                name = projects[0].projectName;
            }
        }
        return name;
    }

    makeTagText() {
        return this._tags.map((tag) => {
            return tag.tagName;
        }).join(', ');
    }

    updateCreate() {

        var issue = this._issue;

        if (issue) {

            $('#edit-form').attr('class', 'create');

            $('#edit-form .task').val(issue.issueName);
            $('#edit-form .project').find('option').remove().end().append($(this.makeProjectOptions((project: Models.Project) => {
                return project.projectName == issue.projectName;
            })));
            $('#edit-form .tags').find('option').remove().end().append($(this.makeTagOptions()));

            $('#edit-form .project').select2({ minimumResultsForSearch: 1 });
            $('#edit-form .tags').select2({ minimumResultsForSearch: 1 });
        }
    }

    updateEdit() {

        var projectSelectedFilter: Function;

        var timer = this._timer;
        var issue = this._issue;

        var task = this._timer && this._timer.workTask;

        if (task) {

            $('#edit-form').attr('class', 'edit');

            $('#edit-form .task').val(task.description);
            $('#edit-form .project').find('option').remove().end().append($(this.makeProjectOptions((project: Models.Project) => {
                return project.projectId == task.projectId;
            })));
            $('#edit-form .tags').find('option').remove().end().append($(this.makeTagOptions()));

            $('#edit-form .project').select2({ minimumResultsForSearch: 1 });
            $('#edit-form .tags').select2({ minimumResultsForSearch: 1 });
        }
    }

    makeProjectOptions(selectedFilter: Function): HTMLOptionElement[] {
        return this._projects.map((project) => {
            return new Option(project.projectName, '' + project.projectId, false, selectedFilter ? selectedFilter(project) : false);
        });
    }

    makeTagOptions() {
        return this._tags.map((tag) => {
            return new Option(tag.tagName, '' + tag.tagId);
        });
    }

    // ui event handlers

    initControls() {
        $('#login').click(() => this._onLoginClick());
        $('#start').click(() => this._onStartClick());
        $('#stop').click(() => this._onStopClick());
        $('#save').click(() => this._onSaveClick());
        $('#edit-link').click(() => this._onEditClick());
        $('#create-link').click(() => this._onCreateClick());
    }

    private _onLoginClick() {
        this.loginAction();
        this.close();
    }

    private _onStartClick() {
        this.updateTimer(this.makeTimer(this._issue, true));
    }

    private _onStopClick() {
        this.updateTimer(this.makeTimer(this._issue, false));
    }

    private _onSaveClick() {
        this.updateTimer(this.makeTimer(this._issue, true));
    }

    private _onEditClick() {
        this.updateEdit();
        this.switchState(this._states.editing);
    }
    private _onCreateClick() {
        this.updateCreate();
        this.switchState(this._states.creating);
    }
}