class PopupBase {

    constructor() {
        this.initControls();
        this.switchState(this._states.loading);
        this.initializeAction().then((data) => {
            this.setData(data);
            if (this._timer && this._timer.isStarted) {
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
    private _timerTagsIds: number[];
    private _projects: Models.Project[];
    private _tags: Models.Tag[];

    callBackground(message: IPopupRequest): Promise<IPopupResponse> { return; };

    close(): void { }

    setData(data: IPopupInitData) {
        if (data.timer) {
            this._issue = data.issue;
            this._timer = data.timer;
            this._timerTagsIds = data.timerTagsIds;
            this._projects = data.projects;
            this._tags = data.tags;
        } else {
            this.close();
        }
    }

    putTimer(timer: Models.Timer) {
        this.switchState(this._states.loading);
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
    loginAction = this.wrapBackgroundAction<void, void>('login');
    putTimerAction = this.wrapBackgroundAction<Models.Timer, IPopupInitData>('putTimer');

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
            $('#view-form .time').text(this.getDuration(this._timer.startTime));
            $('#view-form .task .value').text(task.description);
            $('#view-form .project .value').text(this.getProjectName(task.projectId));
            $('#view-form .tags .value').text(this.makeTimerTagsText());
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
        result = result ? result : '0 min';

        return result;
    }

    getProjectName(projectId: number): string {
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

    getProjectId(projectName: string): number {
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

    getTag(id: number) {
        return this._tags.filter((tag) => {
            return tag.tagId === id;
        })[0];
    }

    makeTimerTagsText() {
        return this._timerTagsIds.map((id) => {
            var tag = this.getTag(id);
            return tag ? tag.tagName : '';
        }).join(', ');
    }

    makeProjectSelectData() {
        return this._projects.map((project) => {
            return { id: project.projectId, text: project.projectName };
        });
    }

    makeTagSelectData() {
        return this._tags.map((tag) => {
            return { id: tag.tagId, text: tag.tagName };
        });
    }

    getDescriptionFieldValue(): string {
        return $('#edit-form .task').val();
    }

    setDescriptionFieldValue(value: string) {
        $('#edit-form .task').val(value);
    }

    getProjectIdField(): number {
        return parseInt($('#edit-form .project').select2().val() || 0);
    }

    setProjectIdFieldValue(id: number) {
        $('#edit-form .project').select2({ data: this.makeProjectSelectData() }).val('' + id).trigger("change");
    }

    getTagsIdsFieldValue(): number[] {
        return ($('#edit-form .tags').select2().val() || []).map(id => parseInt(id));
    }

    setTagsIdsFieldValue(ids: number[]) {
        $('#edit-form .tags').select2({ data: this.makeTagSelectData() }).val(ids.map(id => '' + id)).trigger("change");
    }

    updateCreate() {

        var issue = this._issue;

        if (issue) {

            $('#edit-form').attr('class', 'create');

            var issueName = issue.issueName;
            // REQUIREMENT: when create issue for integrated page do not set issue name
            if (issue.serviceType) {
                issueName = '';
            }

            this.setDescriptionFieldValue(issueName);
            this.setProjectIdFieldValue(this.getProjectId(issue.projectName));
            this.setTagsIdsFieldValue([]);
        }
    }

    updateEdit() {

        var task = this._timer && this._timer.workTask;

        if (task) {

            $('#edit-form').attr('class', 'edit');

            this.setDescriptionFieldValue(task.description);
            this.setProjectIdFieldValue(task.projectId);
            this.setTagsIdsFieldValue(this._timerTagsIds);
        }
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
        var timer = <Models.Timer>{};
        timer.isStarted = true;
        var now = new Date();
        timer.startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toJSON();
        timer.workTask = <Models.WorkTask>{};
        timer.workTask.description = this.getDescriptionFieldValue();
        timer.workTask.projectId = this.getProjectIdField();
        timer.tagsIdentifiers = this.getTagsIdsFieldValue();
        this.putTimer(timer);
    }

    private _onStopClick() {
        var timer = this.clone(this._timer);
        timer.isStarted = false;
        timer.workTask.description = this.getDescriptionFieldValue();
        timer.workTask.projectId = this.getProjectIdField();
        timer.tagsIdentifiers = this.getTagsIdsFieldValue();
        this.putTimer(timer);
    }

    private _onSaveClick() {
        var timer = this.clone(this._timer);
        timer.isStarted = true;
        timer.workTask.description = this.getDescriptionFieldValue();
        timer.workTask.projectId = this.getProjectIdField();
        timer.tagsIdentifiers = this.getTagsIdsFieldValue();
        this.putTimer(timer);
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