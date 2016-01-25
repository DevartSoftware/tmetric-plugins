class PopupBase {

    constructor() {
        this.initControls();
        this.switchState(this._states.loading);
        this.initializeAction().then((data) => {
            this.edit(data);
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

    edit(data: IPopupData) {
        if (data.timer) {
            this._issue = data.issue;
            this._timer = data.timer;
            this._projects = data.projects;
            this._tags = data.tags;
            this.updateEdit();
            this.switchState(this._states.editing);
        } else {
            this.close();
        }
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
            return new Promise((resolve: (value: TResult | Thenable<TResult>) => void, reject: (error?: string) => void) => {
                this.callBackground({
                    action: action,
                    data: data
                }).then((response) => {
                    if (response.error) {
                        reject(<string>response.error);
                    } else {
                        resolve(<TResult>response.data);
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
        editing: 'editing'
    };

    switchState(name: string) {
        $('content').attr('class', name);
    }

    updateEdit() {

        var task = '';
        var projectSelectedFilter: Function;

        var isStarted = false, workTask: Models.WorkTask;

        var timer = this._timer;
        var issue = this._issue;

        if (timer && issue) {

            isStarted = timer.isStarted;
            workTask = timer.workTask;

            if (isStarted) {
                // user have running task
                task = workTask.description;
                projectSelectedFilter = (project: Models.Project) => project.projectId == workTask.projectId;
            } else {
                // user have no running task
                if (issue.projectName) {
                    // page contain issue to start
                    projectSelectedFilter = (project: Models.Project) => project.projectName == issue.projectName;
                } else {
                    // page do not contain issue to start
                    task = issue.issueName;
                }
            }
        }

        $('#edit-form').attr('class', isStarted ? 'timer-started' : 'timer-stopped');

        $('#task').val(task);
        $('#project').find('option').remove().end().append($(this.makeProjectOptions(projectSelectedFilter)));
        $('#tags').find('option').remove().end().append($(this.makeTagOptions()));

        $('#project').select2({ minimumResultsForSearch: 1 });
        $('#tags').select2({ minimumResultsForSearch: 1 });
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
        $('#apply').click(() => this._onApplyClick());
    }

    private _onLoginClick() {
        this.close();
        this.loginAction();
    }

    private _onStartClick() {
        this.updateTimer(this.makeTimer(this._issue, true));
    }

    private _onStopClick() {
        this.updateTimer(this.makeTimer(this._issue, false));
    }

    private _onApplyClick() {
        this.updateTimer(this.makeTimer(this._issue, true));
    }
}