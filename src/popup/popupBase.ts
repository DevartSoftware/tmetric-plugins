class PopupBase {

    constructor() {
        this.initControls();
        this.switchState(this._states.loading);
        this.initializeAction().then((data) => {

            this.setData(data);

            this.fillViewForm(data.timer);
            this.fillTaskForm(this._forms.create, data.task);

            if (data.timer && data.timer.isStarted) {

                this.fillTaskForm(this._forms.edit, {
                    description: data.timer.workTask.description,
                    projectId: data.timer.workTask.projectId,
                    tagIds: data.timer.tagsIdentifiers
                });

                this.switchState(this._states.viewing);
            } else {
                this.switchState(this._states.creating);
            }
        }).catch((error) => {
            this.switchState(this._states.authenticating);
        });
    }

    private _task: ITaskInfo;
    private _activeTimer: Models.Timer;
    private _projects: Models.Project[];
    private _tags: Models.Tag[];

    callBackground(message: IPopupRequest): Promise<IPopupResponse> { return; };

    close(): void { }

    setData(data: IPopupInitData) {
        if (data.timer) {
            this._task = data.task;
            this._activeTimer = data.timer;
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
    loginAction = this.wrapBackgroundAction<void, void>('login');
    putTimerAction = this.wrapBackgroundAction<Models.Timer, IPopupInitData>('putTimer');

    // ui mutations

    private _forms = {
        login: '#login-form',
        view: '#view-form',
        edit: '#edit-form',
        create: '#create-form'
    };

    private _states = {
        loading: 'loading',
        authenticating: 'authenticating',
        creating: 'creating',
        viewing: 'viewing',
        editing: 'editing'
    };

    switchState(name: string) {
        $('content').attr('class', name);
    }

    fillViewForm(timer: Models.Timer) {
        if (timer && timer.workTask) {

            $(this._forms.view + ' .time').text(this.getDuration(timer.startTime));

            if (timer.workTask.description) {
                $(this._forms.view + ' .task .value').text(timer.workTask.description);
            } else {
                $(this._forms.view + ' .task .value').text('(No description)');
            }

            if (timer.workTask.projectId) {
                $(this._forms.view + ' .project .value').text(this.toProjectName(timer.workTask.projectId)).show();
            } else {
                $(this._forms.view + ' .project').hide();
            }

            if (timer.tagsIdentifiers && timer.tagsIdentifiers.length) {
                $(this._forms.view + ' .tags .value').text(this.makeTimerTagsText(timer.tagsIdentifiers)).show();
            } else {
                $(this._forms.view + ' .tags').hide();
            }
        }
    }

    fillTaskForm(selector: string, task: ITaskInfo) {
        $(selector + ' .task .input').val(task.description);
        this.setSelectValue(selector + ' .project .input', { data: this.makeProjectSelectData() }, '' + task.projectId);
        this.setSelectValue(selector + ' .tags .input', { data: this.makeTagSelectData() }, task.tagIds.map(function (tag) { return '' + tag; }));
    }

    fillTaskTimer(selector: string, timer: Models.Timer) {
        timer.workTask = timer.workTask || <Models.WorkTask>{};
        timer.workTask.description = $(selector + ' .task .input').val();
        timer.workTask.projectId = parseInt($(selector + ' .project .input').select2().val() || null);
        timer.tagsIdentifiers = ($(selector + ' .tags .input').select2().val() || []).map(tag => parseInt(tag));
    }

    getDuration(startTime: string) {

        var MINUTE = 1000 * 60;
        var HOUR = MINUTE * 60;

        var start = new Date(startTime).getTime();
        var now = new Date().getTime();

        var duration = Math.abs(start - now);

        var hours = Math.floor(duration / HOUR);
        var minutes = Math.floor((duration - hours * HOUR) / MINUTE);

        var result = [];
        if (hours) {
            result.push(hours + ' h');
        }
        result.push(minutes + ' min');

        return result.join(' ');
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

    getTag(id: number) {
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

    setSelectValue(selector: string, options: Select2Options, value: string | string[]) {
        $(selector).select2(options).val(value).trigger("change");
    };

    // ui event handlers

    initControls() {
        $('#login').click(() => this.onLoginClick());
        $('#start').click(() => this.onStartClick());
        $('#stop').click(() => this.onStopClick());
        $('#save').click(() => this.onSaveClick());
        $('#edit-link').click(() => this.onEditClick());
        $('#create-link').click(() => this.onCreateClick());
    }

    private onLoginClick() {
        this.loginAction();
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

    private onSaveClick() {
        var timer = this.clone(this._activeTimer);
        this.fillTaskTimer(this._forms.edit, timer);
        this.putTimer(timer);
    }

    private onEditClick() {
        this.switchState(this._states.editing);
    }

    private onCreateClick() {
        this.switchState(this._states.creating);
    }
}