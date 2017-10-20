class PopupController {

    constructor(suppressViewState?: boolean) {

        this.initControls();
        this.switchState(this._states.loading);
        this.initializeAction()
            .then(data => {
                this.setData(data);

                if (this.isLongRunning(data.timer.startTime)) {
                    this.fillFixForm(data.timer);
                    this.switchState(this._states.fixing);
                } else if (!suppressViewState && data.timer && data.timer.isStarted) {
                    this.fillViewForm(data.timer);
                    this.fillCreateForm();
                    this.switchState(this._states.viewing);
                } else {
                    this.fillCreateForm();
                    this.switchState(this._states.creating);
                }
            })
            .catch(error => {
                this.isConnectionRetryEnabledAction().then(retrying => {
                    if (retrying) {
                        this.switchState(this._states.retrying);
                    } else {
                        this.switchState(this._states.authenticating);
                    }
                });
            });
    }

    private _activeTimer: Models.Timer;
    private _newIssue: WebToolIssueTimer;
    private _timeFormat: string;
    private _projects: Models.ProjectLite[];
    private _tags: Models.Tag[];
    private _constants: Models.Constants;
    private _canCreateProjects: boolean;
    private _canCreateTags: boolean;

    callBackground(request: IPopupRequest): Promise<IPopupResponse> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(request, (response: IPopupResponse) => {
                resolve(response);
            });
        });
    }

    close() {
        window.close();
    }

    setData(data: IPopupInitData) {
        if (data.timer) {
            this._activeTimer = data.timer;
            this._newIssue = data.newIssue;
            this._timeFormat = data.timeFormat;
            this._projects = data.projects;
            this._tags = data.tags.filter(tag => !!tag).sort((a, b) => this.compareTags(a, b));
            this._constants = data.constants;
            this._canCreateProjects = data.canCreateProjects;
            this._canCreateTags = data.canCreateTags;
        } else {
            this.close();
        }
    }

    putTimer(timer: WebToolIssueTimer) {
        this.putTimerAction(timer);
        this.close();
    }

    private compareTags(t1: Models.Tag, t2: Models.Tag) {

        // sort by type, from tag to worktype
        let diff = (t1.isWorkType ? 1 : 0) - (t2.isWorkType ? 1 : 0);
        if (diff) {
            return diff;
        }

        // sort by name
        let name1 = t1.tagName.toLowerCase();
        let name2 = t2.tagName.toLowerCase();
        return name1 == name2 ? 0 : (name1 > name2 ? 1 : -1);
    }

    // actions

    protected wrapBackgroundAction<TData, TResult>(action: string) {
        return (data?: TData) => {
            return new Promise<TResult>((resolve, reject) => {
                this.callBackground({
                    action: action,
                    data: data
                }).then(response => {
                    if (response.error) {
                        reject(response.error);
                    } else {
                        resolve(response.data);
                    }
                }).catch(error => {
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
    putTimerAction = this.wrapBackgroundAction<WebToolIssueTimer, void>('putTimer');

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

        let url = this.getTaskUrl(details);
        if (url && details.projectTask && details.projectTask.externalIssueId) {
            let a = $(this._forms.view + ' .task .id .link').attr('href', url);
            if (details.projectTask.showIssueId) {
                a.text(details.projectTask.externalIssueId);
            } else {
                a.addClass('fa fa-external-link');
            }
        } else {
            $(this._forms.view + ' .task .id').hide();
        }

        $(this._forms.view + ' .task .name').text(this.toDescription(details.description));

        let projectName = this.toProjectName(details.projectId);

        if (projectName) {
            $(this._forms.view + ' .project .name').text(projectName).show();
        } else {
            $(this._forms.view + ' .project').hide();
        }

        if (timer.tagsIdentifiers && timer.tagsIdentifiers.length) {
            $(this._forms.view + ' .tags .items').append(this.makeTimerTagsElement(timer.tagsIdentifiers)).show();
        } else {
            $(this._forms.view + ' .tags').hide();
        }
    }

    fillCreateForm() {
        this.initProjectSelector(this._forms.create + ' .project .input', this.makeProjectItems());
        $(this._forms.create + ' .new-project .input').attr('maxlength', Models.Limits.maxProjectName);

        this.initTagSelector(this._forms.create + ' #tag-selector', this.makeTagItems(), this.makeTagSelectedItems(), this._canCreateTags);
        $(this._forms.create + ' .tags .select2-search__field').attr('maxlength', Models.Limits.maxTag);

        let taskInput = $(this._forms.create + ' .task .input');
        taskInput.attr('maxlength', Models.Limits.maxTask);
        taskInput.val(this._newIssue.issueName).focus().select();

        setTimeout(() => {
            // Firefox does not allow to focus elements on popup (TE-117)
            if (this._newIssue.description && taskInput.is(':focus')) {
                $(this._forms.create + ' .project .input').select2('focus');
            }
        });
    }

    initCreatingForm() {
        $(this._forms.create + ' .task .input').focus().select();
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
        let startDate = startTime instanceof Date ? startTime : new Date(<string>startTime);
        let result = new Date().getTime() - startDate.getTime();
        return result > 0 ? result : 0;
    }

    toDurationString(startTime: string) {

        const MINUTE = 1000 * 60;
        const HOUR = MINUTE * 60;

        let duration = this.getDuration(startTime);
        let hours = Math.floor(duration / HOUR);
        let minutes = Math.floor((duration - hours * HOUR) / MINUTE);

        let result = [];
        if (hours) {
            result.push(hours + ' h');
        }
        result.push(minutes + ' min');

        return result.join(' ');
    }

    isLongRunning(startTime: string) {

        const HOUR = 1000 * 60 * 60;
        const LONG_RUNNING_DURATION = this._constants.maxTimerHours * HOUR;

        let duration = this.getDuration(startTime);

        return duration >= LONG_RUNNING_DURATION;
    }

    toLongRunningDurationString(startTime: string) {

        let duration = this.getDuration(startTime);

        let now = new Date();

        let durationToday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        let durationYesterday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

        let startDate = new Date(startTime);

        // Output:
        // Started Wed, 03 Feb at 15:31
        let result = '';
        if (duration <= durationToday) {
            result = 'Started today';
        } else if (duration <= durationYesterday) {
            result = 'Started yesterday';
        } else {
            result = 'Started ' + this._weekdaysShort[startDate.getDay()] + ', ' + startDate.getDate() + ' ' + this._monthsShort[startDate.getMonth()];
        }

        let hours = startDate.getHours();
        let minutes = startDate.getMinutes();

        if (this._timeFormat == 'H:mm') {
            result += ' at ' + hours + ':' + (minutes < 10 ? '0' + minutes : minutes);
        } else {
            let period: string;
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
        if (projectId && this._projects) {
            let projects = this._projects.filter(_ => _.projectId === projectId);
            if (projects.length) {
                return projects[0].projectName;
            }
        }
        return '';
    }

    getProject(id: number): Models.ProjectLite {
        let project = null;
        if (this._projects) {
            let projects = this._projects.filter(project => project.projectId === id);
            if (projects.length) {
                project = projects[0];
            }
        }
        return project;
    }

    getTag(id: number): Models.Tag {
        if (this._tags) {
            let tags = this._tags.filter(tag => tag.tagId === id);
            if (tags.length) {
                return tags[0];
            }
        }
        return null;
    }

    makeTimerTagsElement(timerTags: number[]) {
        let sortedTags = timerTags.map(id => this.getTag(id))
            .filter(tag => !!tag)
            .sort(this.compareTags);

        let container = $('<span>');

        sortedTags.forEach((tag, i) => {
            let span = $('<span>').addClass('label').addClass('label-default');

            if (tag.isWorkType) {
                let i = $('<i>').addClass('tag-icon').addClass('fa fa-dollar');
                span.append(i);
            }
            span.append($('<span>').text(tag.tagName));
            container.append(span);
        });

        return container;
    }

    private _selectProjectOption: IdTextPair = { id: 0, text: 'No project' };

    private _createNewProjectOption: IdTextPair = { id: -1, text: 'New project' };

    makeProjectItems() {
        let projects = <IdTextPair[]>[];
        if (this._canCreateProjects) {
            projects.push(this._createNewProjectOption);
        }
        projects.push(this._selectProjectOption);
        return projects.concat(this._projects.map(project => {
            return <IdTextPair>{ id: project.projectId, text: project.projectName };
        }));
    }

    makeTagItem(name: string, isWorkType?: boolean) {
        return <IdTextTagType>{
            id: name,
            text: name,
            isWorkType: !!isWorkType
        };
    }

    makeTagItems() {

        let existingItems = <{ [name: string]: boolean }>{};

        let items = this._tags.map(tag => {
            let name = tag.tagName;
            existingItems[name.toLowerCase()] = true;
            return this.makeTagItem(name, tag.isWorkType);
        });

        let isWorkTypeMap: { [name: string]: boolean } = {};
        this._tags.forEach(tag => {
            isWorkTypeMap[tag.tagName.toLowerCase()] = tag.isWorkType;
        });

        if (this._canCreateTags && this._newIssue.tagNames) {
            this._newIssue.tagNames.forEach(name => {
                let isWorkType = isWorkTypeMap[name.toLowerCase()]
                if (!existingItems[name.toLowerCase()]) {
                    items.push(this.makeTagItem(name, isWorkType));
                }
            });
        }

        return items;
    }

    makeTagSelectedItems() {
        return this._newIssue.tagNames || [];
    }

    initProjectSelector(selector: string, items: IdTextPair[]) {
        $(selector).select2({
            data: items,
            templateSelection: (options) => this.formatSelectedProject(options),
            templateResult: (options) => this.formatProjectItem(options)
        }).val(this._selectProjectOption.id).trigger('change');
    }

    private formatProjectItem(data: Select2SelectionObject) {

        let id = parseInt(data.id);

        // No project
        if (!id) {
            return $('<span>').text(data.text)
        }

        // New project
        if (id == -1) {
            return $('<strong>').text(data.text);
        }

        // Existing project
        return this.formatExistingProject(data);
    }

    private formatSelectedProject(data: Select2SelectionObject) {

        let id = parseInt(data.id);

        // No project
        if (!id) {
            return $('<span class="mute-text">').text('Select project');
        }

        // New Project
        if (id == -1) {
            return $('<span>').text(data.text);
        }

        // Existing project
        return this.formatExistingProject(data);
    }

    private formatExistingProject(data: Select2SelectionObject) {

        let result = $('<span>');

        // Find project
        let projectId = parseInt(data.id)
        let project = this.getProject(projectId);
        let projectName = project ? project.projectName : data.text;
        let projectAvatar = project && project.avatar || 'Content/Avatars/project.svg';

        // Add avatar
        let avatarPath = `${this._constants.serviceUrl}/${projectAvatar}`
        let avatarElement = $(`<img src="${avatarPath}" />`).addClass('project-avatar-image');
        result.append(avatarElement);

        // Add project name
        let projectNameElement = $('<span>').text(projectName);
        return result.append(projectNameElement);
    }

    initTagSelector(selector: string, items: IdTextPair[], selectedItems: string[], allowNewItems?: boolean) {
        $(selector).select2({
            data: items,
            tags: allowNewItems,
            matcher: (a: any, b: any) => {
                let params = <{ term: string }>a;
                let option = <Select2SelectionObject>b;

                let term = $.trim(params.term || "").toLowerCase();
                let text = $(option.element).text().toLowerCase();

                let isSelected = !!(option.element && option.element.selected);
                let isTermIncluded = text.length >= term.length && text.indexOf(term) > -1;
                let isEqual = text == term;

                if (
                    (isSelected && isEqual) || // match selected option to avoid message about not found option during input
                    (!isSelected && isTermIncluded)
                ) {
                    return option;
                }

                return <any>null;
            },
            createTag: (params) => {
                let name = $.trim(params.term);
                if (name) {
                    let foundOptions = $(selector)
                        .find('option')
                        .filter((i, option) => $(option).text().toLowerCase() == name.toLowerCase());
                    if (!foundOptions.length) {
                        return this.makeTagItem(name);
                    }
                }
            },
            templateSelection: (options: ITagSelection) => this.formatTag(options, false),
            templateResult: (options: ITagSelection) => this.formatTag(options, true)
        }).val(selectedItems).trigger('change');
    }

    private formatTag(data: ITagSelection, useIndentForTag: boolean) {

        let textSpan = $('<span>').text(data.text);

        if (data.isWorkType) {
            let i = $('<i>').addClass('tag-icon').addClass('fa fa-dollar');
            return $('<span>').append(i).append(textSpan);
        }

        if (useIndentForTag) {
            textSpan.addClass('tag-without-icon');
        }

        return textSpan;
    }

    // ui event handlers

    initControls() {

        $('#site-link').click(() => (this.onSiteLinkClick(), false));
        $('#task-link').click(() => (this.onTaskLinkClick(), false));
        $('#login').click(() => (this.onLoginClick(), false));
        $('#retry').click(() => (this.onRetryClick(), false));
        $('#fix').click(() => (this.onFixClick(), false));
        $('#start').click(() => (this.onStartClick(), false));
        $('#stop').click(() => (this.onStopClick(), false));
        $('#create').click(() => (this.onCreateClick(), false));
        $(this._forms.create + ' .project .input').change(this.onProjectSelectChange());
        $('.cancel-btn').click(() => (this.onCancelClick(), false));

        // close popup when escape key pressed and no selectors are opened
        window.addEventListener('keydown', event => {
            if (event.keyCode == 27) {
                if (!$('body > .select2-container').length) {
                    this.close();
                }
            }
        }, true);
    }

    private onCancelClick() {
        this.close();
    }

    private onProjectSelectChange() {
        const $divNewProject = $(this._forms.create + ' .new-project');
        const $inputNewProject = $(this._forms.create + ' .new-project .input');
        const self = this;

        return function () {
            if ($(this).val() == -1) { // create new project option
                let issueProjectName = (self._newIssue.projectName) || '';
                $inputNewProject.val(issueProjectName);
                $divNewProject.css('display', 'block');
            } else {
                $divNewProject.css('display', 'none');
            }
        }
    }

    private onSiteLinkClick() {
        this.openTrackerAction();
        this.close();
    }

    private onTaskLinkClick() {
        let url = this.getTaskUrl(this._activeTimer.details);
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

        // Clone issue
        let timer = Object.assign({}, this._newIssue);

        // Set project
        let selectedProject = <Select2SelectionObject>$(this._forms.create + ' .project .input').select2('data')[0];
        if (!selectedProject || !selectedProject.selected || !selectedProject.id) {
            timer.projectName = ''; // No project
        } else if (<any>selectedProject.id > 0) {
            timer.projectName = selectedProject.text; // Existing project
        } else {
            timer.projectName = $.trim($(this._forms.create + ' .new-project .input').val()); // New project
        }

        // Set description and tags
        timer.isStarted = true;
        timer.description = $(this._forms.create + ' .task .input').val();
        timer.tagNames = $(this._forms.create + ' .tags .input').select().val() || [];

        // Put timer
        this.putTimer(timer);
    }

    private onStopClick() {
        this.putTimer(<WebToolIssueTimer>{ isStarted: false });
    }

    private onCreateClick() {
        this.switchState(this._states.creating);
    }
}

interface ITagSelection extends Select2SelectionObject {
    isWorkType: boolean;
}

interface IdTextTagType extends IdTextPair {
    isWorkType: boolean;
}