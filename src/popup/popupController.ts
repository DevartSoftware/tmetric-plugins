class PopupController {

    constructor(public isPagePopup = false) {
        this.initControls();
        this.getData(null);
    }

    private _activeTimer: Models.Timer;
    private _timeFormat: string;
    private _profile: Models.UserProfile;
    private _accountId: number;
    private _projects: Models.ProjectLite[];
    private _clients: Models.Client[];
    private _tags: Models.Tag[];
    private _recentTasks: Models.RecentWorkTask[];
    private _constants: Models.Constants;
    private _canCreateProjects: boolean;
    private _canCreateTags: boolean;
    private _requiredFields: Models.RequiredFields;
    private _newIssue: WebToolIssueTimer;
    private _possibleWebTool: WebToolInfo;

    getData(accountId: number) {

        this.switchState(this._states.loading);

        return this.initializeAction({ accountId, includeRecentTasks: !this.isPagePopup }).then(data => {
            this.setData(data);

            if (this._profile.accountMembership.length > 1) {
                this.fillAccountSelector(data.profile, data.accountId);
            }

            this.fillWebToolAlert();

            if (data.timer.isStarted && this.isLongRunning(data.timer.startTime)) {
                this.fillFixForm(data.timer);
                this.switchState(this._states.fixing);
            } else if (!this.isPagePopup && data.timer && data.timer.isStarted) {
                this.fillViewForm(data.timer);
                this.fillCreateForm(data.defaultProjectId);
                this.switchState(this._states.viewing);
            } else {
                this.fillCreateForm(data.defaultProjectId);
                this.switchState(this._states.creating);
            }
        }).catch(() => {
            this.isConnectionRetryEnabledAction().then(retrying => {
                if (retrying) {
                    this.switchState(this._states.retrying);
                } else {
                    this.switchState(this._states.authenticating);
                }
            });
        });
    }

    callBackground(request: IPopupRequest): Promise<IPopupResponse> {
        return new Promise(resolve => {
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
            this._newIssue = this._newIssue || data.newIssue;
            this._accountId = data.accountId;
            this._profile = data.profile;
            this._timeFormat = data.profile.timeFormat;
            this._projects = data.projects;
            this._clients = data.clients;
            this._tags = data.tags.filter(tag => !!tag).sort((a, b) => this.compareTags(a, b));
            this._constants = data.constants;
            this._canCreateProjects = data.canCreateProjects;
            this._canCreateTags = data.canCreateTags;
            this._requiredFields = data.requiredFields;
            this._possibleWebTool = data.possibleWebTool;
        } else {
            this.close();
        }
    }

    putTimer(accountId: number, timer: WebToolIssueTimer) {
        return this.putTimerAction({ accountId, timer }).then(() => {
            this.close();
        });
    }

    private compareTags(t1: Models.Tag, t2: Models.Tag) {

        // sort by type, from tag to worktype
        const diff = (t1.isWorkType ? 1 : 0) - (t2.isWorkType ? 1 : 0);
        if (diff) {
            return diff;
        }

        // sort by name
        const name1 = t1.tagName.toLowerCase();
        const name2 = t2.tagName.toLowerCase();
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

    initializeAction = this.wrapBackgroundAction<IPopupParams, IPopupInitData>('initialize');
    openTrackerAction = this.wrapBackgroundAction<void, void>('openTracker');
    openPageAction = this.wrapBackgroundAction<string, void>('openPage');
    loginAction = this.wrapBackgroundAction<void, void>('login');
    isConnectionRetryEnabledAction = this.wrapBackgroundAction<void, boolean>('isConnectionRetryEnabled');
    retryAction = this.wrapBackgroundAction<void, void>('retry');
    fixTimerAction = this.wrapBackgroundAction<void, void>('fixTimer');
    putTimerAction = this.wrapBackgroundAction<IPopupTimerData, void>('putTimer');
    saveProjectMapAction = this.wrapBackgroundAction<{ accountId: number; projectName: string; projectId: number }, void>('saveProjectMap');
    saveDescriptionMapAction = this.wrapBackgroundAction<{ taskName: string; description: string }, void>('saveDescriptionMap');
    openOptionsPage = this.wrapBackgroundAction<void, void>('openOptionsPage');
    getRecentTasksAction = this.wrapBackgroundAction<number, Models.RecentWorkTask[]>('getRecentTasks');

    // ui mutations

    private _forms = {
        login: '#login-form',
        fix: '#fix-form',
        view: '#view-form',
        create: '#create-form'
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
        const state = $('content').attr('class');
        if (state == name) {
            return;
        }

        $('content').attr('class', name);

        if (name == this._states.creating) {
            this.focusCreatingForm();
            if (!this.isPagePopup) {
                this.fillRecentTaskSelector();
            }
        }

        let logoText: string;
        let accountSelectorDisabled = true;

        switch (name) {
            case this._states.retrying:
                logoText = 'Error';
                break;
            case this._states.viewing:
                logoText = 'Active Timer';
                break;
            case this._states.creating:
                logoText = 'Start Timer';
                accountSelectorDisabled = false;
                break;
            case this._states.fixing:
                logoText = 'Fix Timer';
                break;
            case this._states.authenticating:
                logoText = 'Not Connected';
                break;
            default:
                logoText = '';
                break;
        }

        $('.logo-text').text(logoText);
        $('#account-selector .dropdown-toggle').prop('disabled', accountSelectorDisabled);
    }

    getAccountMembership(id: number) {
        return this._profile && this._profile.accountMembership.find(_ => _.account.accountId == id);
    }

    fillAccountSelector(profile: Models.UserProfile, accountId: number) {
        if (!profile) {
            return;
        }

        const membership = profile.accountMembership;
        const selectedAccount = membership.find(_ => _.account.accountId == accountId).account;

        const dropdown = $('#account-selector');

        $('.dropdown-toggle-text', dropdown).text(selectedAccount.accountName);

        const menu = $('.dropdown-menu', dropdown);
        menu.empty();

        const items = membership.map(_ => {
            const item = $('<button></button>')
                .addClass('dropdown-menu-item')
                .toggleClass('selected', _.account.accountId == accountId)
                .attr('data-value', _.account.accountId)
                .text(_.account.accountName);
            return item;
        });

        menu.append(items);

        dropdown.show();
    }

    private changeAccount(accountId: number) {
        const state = $('content').attr('class');
        this._newIssue = <WebToolIssueTimer>{};
        this.getData(accountId).then(() => {
            this.switchState(state);
        });
    }

    fillFixForm(timer: Models.Timer) {
        if (timer && timer.details) {
            $(this._forms.fix + ' .description').text(this.toDescription(timer.details.description));
            $(this._forms.fix + ' .startTime').text(this.toLongRunningDurationString(timer.startTime));
        }
    }

    private getTaskLinkData(task: Models.ProjectTask | WebToolIssueTimer)
    private getTaskLinkData(task: Models.ProjectTask & WebToolIssueTimer) {

        if (!task) {
            return {};
        }

        let url = '';
        let text = '';

        const integrationUrl = task.integrationUrl || task.serviceUrl;
        const relativeUrl = task.relativeIssueUrl || task.issueUrl;
        const showIssueId = task.showIssueId;
        const issueId = task.externalIssueId || '' + (task.projectTaskId || '') || task.issueId;

        if (integrationUrl && relativeUrl) { // External task
            url = integrationUrl + relativeUrl;
            if (showIssueId) {
                text = issueId;
            }
        } else if (issueId) { // Internal task
            url = `${this._constants.serviceUrl}#/tasks/${this._accountId}/${issueId}`;
        }

        return { url, text };
    }

    fillWebToolAlert() {

        $('#webtool-alert').toggle(!!this._possibleWebTool);

        if (!this._possibleWebTool) {
            return;
        }

        const message = `We have noticed that you are using ${this._possibleWebTool.serviceName}. Do you want to integrate TMetric with ${this._possibleWebTool.serviceName}?`;
        $('#webtool-alert .alert-text').text(message);
    }

    fillTaskLink(link: JQuery, url: string, text: string) {

        if (!url) {
            return;
        }

        link.attr('href', url);
        link.attr('target', '_blank');

        const iconClass = 'fa fa-external-link';
        if (text) {
            link.text(text);
            link.removeClass(iconClass);
        } else {
            link.text('');
            link.addClass(iconClass);
        }
    }

    fillViewForm(timer: Models.Timer) {

        const details = timer && timer.details;
        if (!details) {
            return
        }

        $(this._forms.view + ' .time').text(this.toDurationString(timer.startTime));

        const projectTask = details.projectTask;

        const { url, text } = this.getTaskLinkData(projectTask);

        if (url) {

            this.fillTaskLink($(this._forms.view + ' .task .id .link'), url, text);

            $(this._forms.view + ' .task')
                .attr('title', projectTask.description)
                .find('.name')
                .text(projectTask.description);

            // not show custom description if equals to default task description
            if (projectTask.description == details.description) {
                $(this._forms.view + ' .notes').hide();
            } else {
                const description = this.toDescription(details.description);
                $(this._forms.view + ' .notes')
                    .attr('title', description)
                    .find('.description')
                    .text(description);
            }
        } else {
            $(this._forms.view + ' .task')
                .attr('title', this.toDescription(details.description))
                .find('.name')
                .text(this.toDescription(details.description));
            $(this._forms.view + ' .notes').hide();
        }

        const projectName = this.toProjectName(details.projectId);

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

    fillCreateForm(projectId?: number) {

        $(this._forms.create + ' .task-recent').toggle(!this.isPagePopup);

        const task = $(this._forms.create + ' .task');
        const description = $(this._forms.create + ' .description');
        const descriptionInput = description.find('.input');
        descriptionInput.attr('maxlength', Models.Limits.maxTask);

        const issue = this._newIssue;

        const { url, text } = this.getTaskLinkData(issue);

        if (url) {
            this.fillTaskLink(task.find('.link'), url, text);

            task.css('display', 'inline-flex');
            task.find('.name').text(issue.issueName);

            description.find('.label').text('Notes');
            description.removeClass('required');
            descriptionInput.attr('placeholder', 'Describe your activity');
            descriptionInput.val(issue.description);
        } else {
            task.css('display', 'none');

            description.find('.label').text('Task');
            description.toggleClass('required', !!(this._requiredFields.description && !this._requiredFields.taskLink));
            descriptionInput.attr('placeholder', 'Enter description');
            descriptionInput.val(issue.description || issue.issueName);
        }

        this.initProjectSelector(projectId);
        $(this._forms.create + ' .new-project .input').attr('maxlength', Models.Limits.maxProjectName);
        $(this._forms.create + ' .project').toggleClass('required', !!this._requiredFields.project);

        // tags selector initialized from project selector change handler onProjectSelectChange
        $(this._forms.create + ' .tags').toggleClass('required', !!this._requiredFields.tags);
    }

    focusCreatingForm() {
        // Timeout workaround for Edge: element is not available immediately on css display changing
        setTimeout(() => {
            // Force focus on current window (for Firefox)
            $(window).focus();

            if (this.isPagePopup && this._newIssue.issueName) {
                $(this._forms.create + ' .project .input').select2('open').select2('close');
            } else {
                $(this._forms.create + ' .description .input').focus().select();
            }
        }, 100);
    }

    fillRecentTaskSelector() {

        const dropdown = $('#recent-task-selector');

        const toggle = $('.dropdown-toggle', dropdown);
        toggle.prop('disabled', true);

        const menu = $('.dropdown-menu', dropdown);
        menu.empty();

        return this.getRecentTasksAction(this._accountId).then(recentTasks => {

            this._recentTasks = recentTasks;

            if (this._recentTasks && this._recentTasks.length) {
                toggle.prop('disabled', false);
                const items = this._recentTasks.map((task, index) =>
                    this.formatRecentTaskSelectorItem(task, index));
                menu.append(items);
            }
        });
    }

    private formatRecentTaskSelectorItem(task: Models.RecentWorkTask, index: number) {

        const item = $('<button></button>')
            .addClass('dropdown-menu-item')
            .attr('data-value', index);

        const description = $('<span>').text(task.details.description);
        description.attr('title', task.details.description);
        item.append(description);

        if (task.details.projectId) {
            const project = this.formatExistingProjectCompact(task.details.projectId);
            item.append(project);
        }

        return item;
    }

    fillFormWithRecentTask(index: number) {

        if (!this._recentTasks || !this._recentTasks.length) {
            return;
        }

        const task = this._recentTasks[index];
        if (!task) {
            return;
        }

        const issue = <WebToolIssueTimer>{};
        let projectId = null;

        issue.description = task.details.description;

        if (task.tagsIdentifiers) {
            issue.tagNames = task.tagsIdentifiers.map(id => {
                const tag = this.getTag(id);
                return tag && tag.tagName;
            }).filter(_ => !!_);
        }

        if (task.details) {

            const project = this.getProject(task.details.projectId);
            if (project) {
                issue.projectName = project.projectName;
                projectId = project.projectId;
            }

            const projectTask = task.details.projectTask;
            if (projectTask) {
                issue.issueId = projectTask.externalIssueId || '' + (projectTask.projectTaskId || '');
                issue.issueName = projectTask.description;
                issue.issueUrl = projectTask.relativeIssueUrl;
                //issue.serviceType =
                issue.serviceUrl = projectTask.integrationUrl;
                issue.showIssueId = projectTask.showIssueId;
            }
        }

        this._newIssue = issue;

        this.fillCreateForm(projectId);
        this.focusCreatingForm();
    }

    private _weekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    private _monthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');

    getDuration(startTime: Date | string) {
        const startDate = startTime instanceof Date ? startTime : new Date(<string>startTime);
        const result = new Date().getTime() - startDate.getTime();
        return result > 0 ? result : 0;
    }

    toDurationString(startTime: string) {

        const MINUTE = 1000 * 60;
        const HOUR = MINUTE * 60;

        const duration = this.getDuration(startTime);
        const hours = Math.floor(duration / HOUR);
        const minutes = Math.floor((duration - hours * HOUR) / MINUTE);

        const result = [];
        if (hours) {
            result.push(hours + ' h');
        }
        result.push(minutes + ' min');

        return result.join(' ');
    }

    isLongRunning(startTime: string) {

        const HOUR = 1000 * 60 * 60;
        const LONG_RUNNING_DURATION = this._constants.maxTimerHours * HOUR;

        const duration = this.getDuration(startTime);

        return duration >= LONG_RUNNING_DURATION;
    }

    toLongRunningDurationString(startTime: string) {

        const duration = this.getDuration(startTime);

        const now = new Date();

        const durationToday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        const durationYesterday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

        const startDate = new Date(startTime);

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
        const minutes = startDate.getMinutes();

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
            const projects = this._projects.filter(_ => _.projectId === projectId);
            if (projects.length) {
                return projects[0].projectName;
            }
        }
        return '';
    }

    getProject(id: number): Models.ProjectLite {
        let project = null;
        if (this._projects) {
            const projects = this._projects.filter(project => project.projectId === id);
            if (projects.length) {
                project = projects[0];
            }
        }
        return project;
    }

    getClient(id: number): Models.Client {
        if (this._clients) {
            const clients = this._clients.filter(client => client.clientId === id);
            if (clients.length) {
                return clients[0];
            }
        }
        return null;
    }

    getTag(id: number): Models.Tag {
        if (this._tags) {
            const tags = this._tags.filter(tag => tag.tagId === id);
            if (tags.length) {
                return tags[0];
            }
        }
        return null;
    }

    makeTimerTagsElement(timerTags: number[]) {
        const sortedTags = timerTags.map(id => this.getTag(id))
            .filter(tag => !!tag)
            .sort(this.compareTags);

        const container = $('<span>');

        sortedTags.forEach((tag, i) => {
            const span = $('<span>').addClass('tag').addClass('tag-default');

            if (tag.isWorkType) {
                const i = $('<i>').addClass('tag-icon').addClass('fa fa-dollar');
                span.append(i);
            }
            span.append($('<span>').text(tag.tagName));
            container.append(span);
        });

        return container;
    }

    private noProjectOption: IdTextPair = { id: 0, text: 'No project' };

    private createProjectOption: IdTextPair = { id: -1, text: 'New project' };

    makeTagItem(name: string, isWorkType?: boolean) {
        return <IdTextTagType>{
            id: name,
            text: name,
            isWorkType: !!isWorkType
        };
    }

    makeTagItems(projectId: number = null) {

        const items: IdTextTagType[] = [];
        const accountTagNames: { [name: string]: boolean } = {};
        const projectWorkTypeIds: { [id: number]: boolean } = {};

        const project = this.getProject(projectId);
        if (project) {
            project.workTypeIdentifires.forEach(id => {
                projectWorkTypeIds[id] = true;
            });
        }

        this._tags.forEach(tag => {
            const key = tag.tagName.toLowerCase();
            accountTagNames[key] = true;
            if (!project || !tag.isWorkType || projectWorkTypeIds[tag.tagId]) {
                items.push(this.makeTagItem(tag.tagName, tag.isWorkType));
            }
        });

        if (this._canCreateTags && this._newIssue.tagNames) {
            this._newIssue.tagNames.forEach(tagName => {
                const key = tagName.toLowerCase();
                if (!accountTagNames[key]) {
                    items.push(this.makeTagItem(tagName, false));
                }
            });
        }

        return items;
    }

    makeTagSelectedItems() {
        return this._newIssue.tagNames || [];
    }

    initProjectSelector(defaultProjectId: number) {

        const query = this._forms.create + ' .project .input';

        let existingProjectId: number;
        const newProjectName = this._newIssue && this._newIssue.projectName;

        const items = <IdTextPair[]>[];
        if (this._canCreateProjects) {
            items.push(this.createProjectOption);
        }
        items.push(this.noProjectOption);
        items.push(...this._projects.map(project => {
            const projectCode = project.projectCode ? ` [${project.projectCode}]` : '';
            const projectClient = project.clientId ? ` / ${this.getClient(project.clientId).clientName}` : '';

            // Find project if it is specified in new issue (TE-219)
            if (newProjectName && project.projectName.toLowerCase() == newProjectName.toLowerCase()) {
                existingProjectId = project.projectId;
            }
            return <IdTextPair>{ id: project.projectId, text: project.projectName + projectCode + projectClient };
        }));

        if (!defaultProjectId) {
            if (existingProjectId) {
                defaultProjectId = existingProjectId; // Select existing project (TE-215)
            } else if (this.isPagePopup && this._canCreateProjects && newProjectName) {
                defaultProjectId = this.createProjectOption.id; // Select new project
            } else {
                defaultProjectId = this.noProjectOption.id;
            }
        }

        $(query)
            .empty()
            .select2({
                data: items,
                templateSelection: (options) => this.formatSelectedProject(options),
                templateResult: (options) => this.formatProjectItem(options)
            })
            .val(defaultProjectId.toString())
            .trigger('change');

        // Force set selected flag in true value for default project.
        // Because select2 does not do it itself.
        const data: Select2SelectionObject[] = $(query).select2('data');
        const selectedItem = data[0];
        if (selectedItem) {
            selectedItem.selected = true;
        }
    }

    private formatProjectItem(data: Select2SelectionObject) {

        const id = parseInt(data.id);

        // No project
        if (!id) {
            return $('<span>').text(data.text)
        }

        // New project
        if (id == -1) {
            return $('<strong>').text(data.text);
        }

        // Existing project
        return this.formatExistingProject(data, true);
    }

    private formatSelectedProject(data: Select2SelectionObject) {

        const id = parseInt(data.id);

        // No project
        if (!id) {
            return $('<span class="mute-text">').text('Select project');
        }

        // New Project
        if (id == -1) {
            return $('<span>').text(data.text);
        }

        // Existing project
        return this.formatExistingProject(data, false);
    }

    private formatExistingProject(data: Select2SelectionObject, includeCodeAndClient: boolean) {

        const projectId = parseInt(data.id);

        const result = $('<span class="flex-container-with-overflow" />');
        const projectPartsContainer = $('<span class="text-overflow" />');

        // Find project
        const project = this.getProject(projectId);

        // Add avatar
        const avatarElement = this.formatProjectAvatar(project);
        result.append(avatarElement);

        // Add project name
        const projectName = project ? project.projectName : data.text;
        const projectNameElement = $('<span class="text-overflow">').text(projectName);
        projectPartsContainer.append(projectNameElement);

        // Add project client and code

        let projectTitle = projectName;

        if (project && includeCodeAndClient) {

            if (project.projectCode) {
                const projectCode = ' [' + project.projectCode + ']';
                const projectCodeElement = $('<span />').text(projectCode);
                projectPartsContainer.append(projectCodeElement);
                projectTitle += projectCode;
            }

            if (project.clientId) {
                const projectClient = ' / ' + this.getClient(project.clientId).clientName;
                const projectClientElement = $('<span class="text-muted" />').text(projectClient);
                projectPartsContainer.append(projectClientElement);
                projectTitle += projectClient;
            }
        }

        projectPartsContainer.attr('title', projectTitle);

        result.append(projectPartsContainer);

        return result;
    }

    private formatExistingProjectCompact(id: number) {

        const result = $('<span class="" />');

        // Find project
        const project = this.getProject(id);

        // Add avatar
        result.append(this.formatProjectAvatar(project));

        // Add name
        const name = project ? project.projectName : '';
        result.append(name);

        result.attr('title', name);

        return result;
    }

    private formatProjectAvatar(project: Models.ProjectLite) {
        let avatar = project && project.avatar || 'Content/Avatars/project.svg';
        avatar = avatar.replace(/^\//, '');
        let avatarUrl = `${this._constants.storageUrl}${avatar}`;
        if (!/\.svg$/.test(avatarUrl)) {
            avatarUrl = avatarUrl.replace(/(.+)(\.\w+)$/, '$1~s48$2');
        }
        return $(`<img src="${avatarUrl}" />`).addClass('project-avatar-image');
    }

    initTagSelector(projectId: number = null) {

        const query = this._forms.create + ' .tags';

        const items = this.makeTagItems(projectId);
        const selectedItems = this.makeTagSelectedItems();
        const allowNewItems = this._canCreateTags;

        $(query + ' .input')
            .empty()
            .select2({
                data: items,
                tags: allowNewItems,
                matcher: (a: any, b: any) => {
                    const params = <{ term: string }>a;
                    const option = <Select2SelectionObject>b;

                    const term = $.trim(params.term || "").toLowerCase();
                    const text = $(option.element).text().toLowerCase();

                    const isSelected = !!(option.element && option.element.selected);
                    const isTermIncluded = text.length >= term.length && text.indexOf(term) > -1;
                    const isEqual = text == term;

                    if (
                        (isSelected && isEqual) || // match selected option to avoid message about not found option during input
                        (!isSelected && isTermIncluded)
                    ) {
                        return option;
                    }

                    return <any>null;
                },
                createTag: (params) => {
                    const name = $.trim(params.term);
                    if (name) {
                        const foundOptions = $(query)
                            .find('option')
                            .filter((i, option) => $(option).text().toLowerCase() == name.toLowerCase());
                        if (!foundOptions.length) {
                            return this.makeTagItem(name);
                        }
                    }
                },
                templateSelection: (options: TagSelection) => this.formatTag(options, false),
                templateResult: (options: TagSelection) => this.formatTag(options, true)
            })
            .val(selectedItems)
            .trigger('change');

        $(query + ' .select2-search__field').attr('maxlength', Models.Limits.maxTag);
    }

    private formatTag(data: TagSelection, useIndentForTag: boolean) {

        const textSpan = $('<span>').text(data.text);

        if (data.isWorkType) {
            const i = $('<i>').addClass('tag-icon').addClass('fa fa-dollar');
            return $('<span>').append(i).append(textSpan);
        }

        if (useIndentForTag) {
            textSpan.addClass('tag-without-icon');
        }

        return textSpan;
    }

    // required fields

    private showRequiredInputError(query: string) {
        const field = $(query);
        const fieldInput = $('.input', field);

        field.addClass('error');
        fieldInput.focus();

        if (!field.hasClass('validated')) {
            field.addClass('validated');
            fieldInput.on('input', (event) => {
                field.toggleClass('error', !$(event.target).val());
            });
        }
    }

    private showRequiredSelectError(query: string) {
        const field = $(query);
        const fieldSelect = $('.input', field);

        field.addClass('error');
        fieldSelect.select2('open').select2('close'); // focus select2

        if (!field.hasClass('validated')) {
            field.addClass('validated');
            fieldSelect.on('change', (event) => {
                field.toggleClass('error', $(event.target).val() == 0);
            });
        }
    }

    private checkRequiredFields(timer: WebToolIssueTimer) {

        $(this._forms.create + ' .error').removeClass('error');

        if (this._requiredFields.description && !timer.issueName && !timer.description) {

            this.showRequiredInputError(this._forms.create + ' .description');
        } else if (this._requiredFields.project && !timer.projectName) {

            if ($(this._forms.create + ' .project .input').val() == -1) {
                this.showRequiredInputError(this._forms.create + ' .new-project');
            } else {
                this.showRequiredSelectError(this._forms.create + ' .project');
            }
        } else if (this._requiredFields.tags && (!timer.tagNames || !timer.tagNames.length)) {

            this.showRequiredSelectError(this._forms.create + ' .tags');
        }

        return $(this._forms.create + ' .error').length == 0;
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
        $(this._forms.create + ' .project .input').change(() => (this.onProjectSelectChange(), false));
        $('.cancel-btn').click(() => (this.onCancelClick(), false));
        $('#settings-btn').click(() => (this.onSettingsClick(), false));
        $('#integrate-webtool').click(() => (this.onIntegrateWebToolClick(), false));

        this.initDropdown('#account-selector', (accountId) => {
            this.changeAccount(accountId);
        });

        this.initDropdown('#recent-task-selector', (index) => {
            this.fillFormWithRecentTask(index);
        });

        $('#clear-create-form').click(() => this.onClearCreateFormClick());

        // close popup when escape key pressed and no selectors are opened
        window.addEventListener('keydown', event => {
            if (event.keyCode == 27) {
                if (!$('body > .select2-container').length) {
                    this.close();
                }
            }
        }, true);
    }

    initDropdown(selector: string, onItemClick: (value: any) => void) {

        const dropdown = $(selector);
        const toggle = $('.dropdown-toggle', dropdown);
        const toggleIcon = $('.fa', toggle);
        const menu = $('.dropdown-menu', dropdown);

        function checkCloseClick(event) {
            if (!$(event.target).closest(dropdown).length) {
                /* eslint-disable-next-line */
                toggleDropdown(false);
            }
        }

        function toggleDropdown(open: boolean) {
            dropdown.toggleClass('open', open);
            toggleIcon.toggleClass('fa-angle-up', open);
            toggleIcon.toggleClass('fa-angle-down', !open);

            if (open) {
                $(document.body).on('click', checkCloseClick);
            } else {
                $(document.body).off('click', checkCloseClick);
            }
        }

        toggle.click(() => {
            if (toggle.prop('disabled')) {
                return;
            }
            const isOpen = dropdown.hasClass('open');
            toggleDropdown(!isOpen);
        });

        menu.click(event => {
            const target = $(event.target);
            const item = target.hasClass('dropdown-menu-item') ? target : target.closest('.dropdown-menu-item');
            if (!item.length) {
                return;
            }
            const value = $(item).attr('data-value');
            onItemClick(value);
            toggleDropdown(false);
        });
    }

    private onCancelClick() {
        this.close();
    }

    private onSettingsClick() {
        this.openOptionsPage();
    }

    private async onIntegrateWebToolClick() {
        const manager = new PermissionManager();
        const map = WebToolManager.toServiceTypesMap([this._possibleWebTool]);
        const result = await manager.requestPermissions(map);
        // User interaction with browser permission popup causes tmetric popup to close.
        // So no code will be execute after permission request.
        // For case when permission was removed, Chrome does not display permissions popup second time.
        // Permissions will be enabled on our request without distracting user.
        // Close popup intentionally for this case.
        if (result) {
            this.close();
        }
    }

    private onProjectSelectChange() {
        const newProjectContainer = $(this._forms.create + ' .new-project');
        const newProjectInput = $('.input', newProjectContainer);

        const value = parseInt($(this._forms.create + ' .project .input').val());
        if (value == -1) { // create new project option
            const issueProjectName = (this._newIssue.projectName) || '';
            newProjectInput.val(issueProjectName);
            newProjectContainer.css('display', 'block');
        } else {
            newProjectContainer.css('display', 'none');
        }

        this.initTagSelector(value);
    }

    private async onSiteLinkClick() {
        await this.openTrackerAction();
        this.close();
    }

    private async onTaskLinkClick() {
        const url = $('#task-link').attr('href');
        if (url) {
            await this.openPageAction(url);
            this.close();
        }
    }

    private async onLoginClick() {
        await this.loginAction();
        this.close();
    }

    private async onRetryClick() {
        await this.retryAction();
        this.close();
    }

    private async onFixClick() {
        await this.fixTimerAction();
        this.close();
    }

    private onStartClick() {

        // Clone issue
        const timer = Object.assign({}, this._newIssue);

        // Set project
        const selectedProject = <Select2SelectionObject>$(this._forms.create + ' .project .input').select2('data')[0];
        const selectedProjectId = Number(selectedProject.id);

        if (!selectedProject || !selectedProject.selected || !selectedProjectId) {
            timer.projectName = ''; // No project
        } else if (selectedProjectId > 0) {
            const project = this._projects.filter(_ => _.projectId == selectedProjectId)[0];
            timer.projectName = project && project.projectName; // Existing project
            timer.projectId = project && project.projectId;
        } else {
            timer.projectName = $.trim($(this._forms.create + ' .new-project .input').val()); // New project
        }

        // Set description and tags
        timer.isStarted = true;
        timer.description = $(this._forms.create + ' .description .input').val();
        timer.tagNames = $(this._forms.create + ' .tags .input').select().val() || [];

        if (!this.checkRequiredFields(timer)) {
            return;
        }

        const accountId = this._accountId;

        // Put timer
        this.putTimer(accountId, timer).then(() => {

            // Save project map
            const projectName = this._newIssue.projectName || '';
            const newProjectName = timer.projectName || '';
            const existingProjects = this._projects.filter(_ => _.projectName == newProjectName);
            const existingProject = existingProjects.find(p => p.projectId == timer.projectId) || existingProjects[0];

            if (newProjectName == projectName && existingProjects.length < 2) {
                this.saveProjectMapAction({ accountId, projectName, projectId: null });
            } else if (existingProject) {
                this.saveProjectMapAction({ accountId, projectName, projectId: existingProject.projectId });
            }

            if (timer.issueId && timer.description != this._newIssue.description) {
                // Save description map
                this.saveDescriptionMapAction({
                    taskName: this._newIssue.issueName,
                    description: timer.description
                });
            }
        });
    }

    private onStopClick() {
        this.putTimer(this._profile.activeAccountId, { isStarted: false });
    }

    private onCreateClick() {
        this.switchState(this._states.creating);
    }

    private onClearCreateFormClick() {
        this._newIssue = <WebToolIssueTimer>{};
        this.fillCreateForm(null);
        this.focusCreatingForm();
    }
}

interface TagSelection extends Select2SelectionObject {
    isWorkType: boolean;
}

interface IdTextTagType extends IdTextPair {
    isWorkType: boolean;
}