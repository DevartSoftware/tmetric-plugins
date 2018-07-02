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
    private _newIssue: WebToolIssueTimer;

    getData(accountId: number) {

        this.switchState(this._states.loading);

        return this.initializeAction({ accountId, includeRecentTasks: !this.isPagePopup }).then(data => {
            this.setData(data);

            if (this._profile.accountMembership.length > 1) {
                this.fillAccountSelector(data.profile, data.accountId);
            }

            if (data.timer.isStarted && this.isLongRunning(data.timer.startTime)) {
                this.fillFixForm(data.timer);
                this.switchState(this._states.fixing);
            } else if (!this.isPagePopup && data.timer && data.timer.isStarted) {
                this.fillViewForm(data.timer, data.accountId);
                this.fillCreateForm(data.defaultProjectId);
                this.fillRecentTaskSelector();
                this.switchState(this._states.viewing);
            } else {
                this.fillCreateForm(data.defaultProjectId);
                this.fillRecentTaskSelector();
                this.switchState(this._states.creating);
            }
        }).catch(error => {
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
            this._newIssue = this._newIssue || data.newIssue;
            this._accountId = data.accountId;
            this._profile = data.profile;
            this._timeFormat = data.profile.timeFormat;
            this._projects = data.projects;
            this._clients = data.clients;
            this._tags = data.tags.filter(tag => !!tag).sort((a, b) => this.compareTags(a, b));
            this._recentTasks = data.recentTasks;
            this._constants = data.constants;
            this._canCreateProjects = data.canCreateProjects;
            this._canCreateTags = data.canCreateTags;
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

    initializeAction = this.wrapBackgroundAction<IPopupParams, IPopupInitData>('initialize');
    openTrackerAction = this.wrapBackgroundAction<void, void>('openTracker');
    openPageAction = this.wrapBackgroundAction<string, void>('openPage');
    loginAction = this.wrapBackgroundAction<void, void>('login');
    isConnectionRetryEnabledAction = this.wrapBackgroundAction<void, boolean>('isConnectionRetryEnabled');
    retryAction = this.wrapBackgroundAction<void, void>('retry');
    fixTimerAction = this.wrapBackgroundAction<void, void>('fixTimer');
    putTimerAction = this.wrapBackgroundAction<IPopupTimerData, void>('putTimer');
    saveProjectMapAction = this.wrapBackgroundAction<{ projectName: string, projectId: number }, void>('saveProjectMap');
    saveDescriptionMapAction = this.wrapBackgroundAction<{ taskName: string, description: string }, void>('saveDescriptionMap');
    openOptionsPage = this.wrapBackgroundAction<void, void>('openOptionsPage');

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

        let membership = profile.accountMembership;
        let selectedAccount = membership.find(_ => _.account.accountId == accountId).account;

        let dropdown = $('#account-selector');

        $('.dropdown-toggle-text', dropdown).text(selectedAccount.accountName);

        let menu = $('.dropdown-menu', dropdown);
        menu.empty();

        let items = membership.map(_ => {
            let item = $('<button></button>')
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
        let state = $('content').attr('class');
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

    private getTaskLinkData(task: Models.ProjectTask | WebToolIssueTimer) {
        let url = '';
        let text = '';

        const merge = { ...<Models.ProjectTask>task, ...<WebToolIssueTimer>task };

        const integrationUrl = merge.integrationUrl || merge.serviceUrl;
        const relativeUrl = merge.relativeIssueUrl || merge.issueUrl;
        const showIssueId = merge.showIssueId;
        const issueId = merge.externalIssueId || '' + (merge.projectTaskId || '') || merge.issueId;

        if (integrationUrl && relativeUrl) {  // External task
            url = integrationUrl + relativeUrl;
            if (showIssueId) {
                text = issueId;
            }
        } else if (issueId) { // Internal task
            url = `${this._constants.serviceUrl}#/tasks/${this._accountId}?id=${issueId}`;
        }

        return { url, text };
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

    fillViewForm(timer: Models.Timer, accountId: number) {

        let details = timer && timer.details;
        if (!details) {
            return
        }

        $(this._forms.view + ' .time').text(this.toDurationString(timer.startTime));

        let projectTask = details.projectTask;

        let { url, text } = this.getTaskLinkData(projectTask);

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
                let description = this.toDescription(details.description);
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

    fillCreateForm(projectId: number) {

        let taskSpan = $(this._forms.create + ' .task');
        let descriptionSpan = $(this._forms.create + ' .description');
        let descriptionInput = descriptionSpan.find('.input');
        descriptionInput.attr('maxlength', Models.Limits.maxTask);

        let issue = this._newIssue;

        let { url, text } = this.getTaskLinkData(issue);

        if (url) {

            this.fillTaskLink(taskSpan.find('.link'), url, text);

            taskSpan.find('.name').text(issue.issueName);
            descriptionSpan.find('.label').text('Notes');
            descriptionInput.attr('placeholder', 'Describe your activity');
            descriptionInput.val(issue.description);
            $(taskSpan).css('display', 'inline-flex');
        } else {
            descriptionSpan.find('.label').text('Task');
            descriptionInput.attr('placeholder', 'Enter description');
            descriptionInput.val(issue.description || issue.issueName);
            $(taskSpan).css('display', 'none');
        }

        // Force focus on current window (for Firefox)
        $(window).focus();
        descriptionInput.focus().select();

        this.initProjectSelector(this._forms.create + ' .project .input', projectId);
        $(this._forms.create + ' .new-project .input').attr('maxlength', Models.Limits.maxProjectName);

        this.initTagSelector(projectId);

        // Do not focus project in extension popup (TE-117, TE-221)
        if (this.isPagePopup && issue.issueName) {
            setTimeout(() => {
                // Focus select2 dropdown
                $(this._forms.create + ' .project .input').select2('open').select2('close');
            });
        }
    }

    initCreatingForm() {
        // workaround for Edge: element is not available immediately on css display changing
        setTimeout(() => {
            $(this._forms.create + ' .task .input').focus().select();
        }, 100);
    }

    fillRecentTaskSelector() {

        if (this.isPagePopup) {
            $(this._forms.create + ' .task-recent').hide();
            return;
        }

        let dropdown = $('#recent-task-selector');

        let toggle = $('.dropdown-toggle', dropdown);

        let menu = $('.dropdown-menu', dropdown);
        menu.empty();

        if (this._recentTasks && this._recentTasks.length) {
            toggle.prop('disabled', false);
            let items = this._recentTasks.map((task, index) =>
                this.formatRecentTaskSelectorItem(task, index));
            menu.append(items);
        } else {
            toggle.prop('disabled', true);
        }

        $(this._forms.create + ' .task-recent').show();
    }

    private formatRecentTaskSelectorItem(task: Models.RecentWorkTask, index: number) {

        let item = $('<button></button>')
            .addClass('dropdown-menu-item')
            .attr('data-value', index);

        let description = $('<span>').text(task.details.description);
        description.attr('title', task.details.description);
        item.append(description);

        if (task.details.projectId) {
            let project = this.formatExistingProjectCompact(task.details.projectId);
            item.append(project);
        }

        return item;
    }

    fillFormWithRecentTask(index: number) {

        if (!this._recentTasks || !this._recentTasks.length) {
            return;
        }

        let task = this._recentTasks[index];
        if (!task) {
            return;
        }

        let issue = <WebToolIssueTimer>{};
        let projectId = null;

        issue.description = task.details.description;

        if (task.tagsIdentifiers) {
            issue.tagNames = task.tagsIdentifiers.map(id => {
                let tag = this.getTag(id);
                return tag && tag.tagName;
            }).filter(_ => !!_);
        }

        if (task.details) {

            let project = this.getProject(task.details.projectId);
            if (project) {
                issue.projectName = project.projectName;
                projectId = project.projectId;
            }

            let projectTask = task.details.projectTask;
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

    getClient(id: number): Models.Client {
        if (this._clients) {
            let clients = this._clients.filter(client => client.clientId === id);
            if (clients.length) {
                return clients[0];
            }
        }
        return null;
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
            let span = $('<span>').addClass('tag').addClass('tag-default');

            if (tag.isWorkType) {
                let i = $('<i>').addClass('tag-icon').addClass('fa fa-dollar');
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

        let items: IdTextTagType[] = [];
        let accountTagNames: { [name: string]: boolean } = {};
        let projectWorkTypeIds: { [id: number]: boolean } = {};

        let project = this.getProject(projectId);
        if (project) {
            project.workTypeIdentifires.forEach(id => {
                projectWorkTypeIds[id] = true;
            });
        }

        this._tags.forEach(tag => {
            let key = tag.tagName.toLowerCase();
            accountTagNames[key] = true;
            if (!project || !tag.isWorkType || projectWorkTypeIds[tag.tagId]) {
                items.push(this.makeTagItem(tag.tagName, tag.isWorkType));
            }
        });

        if (this._canCreateTags && this._newIssue.tagNames) {
            this._newIssue.tagNames.forEach(tagName => {
                let key = tagName.toLowerCase();
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

    initProjectSelector(selector: string, defaultProjectId: number) {

        let existingProjectId: number;
        let newProjectName = this._newIssue && this._newIssue.projectName;

        let items = <IdTextPair[]>[];
        if (this._canCreateProjects) {
            items.push(this.createProjectOption);
        }
        items.push(this.noProjectOption);
        items.push(...this._projects.map(project => {
            let projectCode = project.projectCode ? ` [${project.projectCode}]` : '';
            let projectClient = project.clientId ? ` / ${this.getClient(project.clientId).clientName}` : '';

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

        $(selector)
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
        let data: Select2SelectionObject[] = $(selector).select2('data');
        let selectedItem = data[0];
        if (selectedItem) {
            selectedItem.selected = true;
        }
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
        return this.formatExistingProject(data, true);
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
        return this.formatExistingProject(data, false);
    }

    private formatExistingProject(data: Select2SelectionObject, includeCodeAndClient: boolean) {

        let projectId = parseInt(data.id);

        let result = $('<span class="flex-container-with-overflow" />');
        let projectPartsContainer = $('<span class="text-overflow" />');

        // Find project
        let project = this.getProject(projectId);

        // Add avatar
        let avatarElement = this.formatProjectAvatar(project);
        result.append(avatarElement);

        // Add project name
        let projectName = project ? project.projectName : data.text;
        let projectNameElement = $('<span class="text-overflow">').text(projectName);
        projectPartsContainer.append(projectNameElement);

        // Add project client and code

        let projectTitle = projectName;

        if (project && includeCodeAndClient) {

            if (project.projectCode) {
                let projectCode = ' [' + project.projectCode + ']';
                let projectCodeElement = $('<span />').text(projectCode);
                projectPartsContainer.append(projectCodeElement);
                projectTitle += projectCode;
            }

            if (project.clientId) {
                let projectClient = ' / ' + this.getClient(project.clientId).clientName;
                let projectClientElement = $('<span class="text-muted" />').text(projectClient);
                projectPartsContainer.append(projectClientElement);
                projectTitle += projectClient;
            }
        }

        projectPartsContainer.attr('title', projectTitle);

        result.append(projectPartsContainer);

        return result;
    }

    private formatExistingProjectCompact(id: number) {

        let result = $('<span class="" />');

        // Find project
        let project = this.getProject(id);

        // Add avatar
        result.append(this.formatProjectAvatar(project));

        // Add name
        let name = project ? project.projectName : '';
        result.append(name);

        result.attr('title', name);

        return result;
    }

    private formatProjectAvatar(project: Models.ProjectLite) {
        let avatar = project && project.avatar || 'Content/Avatars/project.svg';
        let avatarPath = `${this._constants.serviceUrl}${avatar}`
        return $(`<img src="${avatarPath}" />`).addClass('project-avatar-image');
    }

    initTagSelector(projectId: number = null) {

        let selector = this._forms.create + ' .tags';

        let items = this.makeTagItems(projectId);
        let selectedItems = this.makeTagSelectedItems();
        let allowNewItems = this._canCreateTags;

        $(selector + ' #tag-selector')
            .empty()
            .select2({
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
            })
            .val(selectedItems)
            .trigger('change');

        $(selector + ' .select2-search__field').attr('maxlength', Models.Limits.maxTag);
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
        $(this._forms.create + ' .project .input').change(() => (this.onProjectSelectChange(), false));
        $('.cancel-btn').click(() => (this.onCancelClick(), false));
        $('#settings-btn').click(() => (this.onSettingsClick(), false));

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

        let dropdown = $(selector);
        let toggle = $('.dropdown-toggle', dropdown);
        let toggleText = $('.dropdown-toggle-text', toggle);
        let toggleIcon = $('.fa', toggle);
        let menu = $('.dropdown-menu', dropdown);

        function checkCloseClick(event) {
            if (!$(event.target).closest(dropdown).length) {
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
            let isOpen = dropdown.hasClass('open');
            toggleDropdown(!isOpen);
        });

        menu.click(event => {
            let target = $(event.target);
            let item = target.hasClass('dropdown-menu-item') ? target : target.closest('.dropdown-menu-item');
            if (!item.length) {
                return;
            }
            let value = $(item).attr('data-value');
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

    private onProjectSelectChange() {
        const newProjectContainer = $(this._forms.create + ' .new-project');
        const newProjectInput = $('.input', newProjectContainer);

        let value = $(this._forms.create + ' .project .input').val();
        if (value == -1) { // create new project option
            let issueProjectName = (this._newIssue.projectName) || '';
            newProjectInput.val(issueProjectName);
            newProjectContainer.css('display', 'block');
        } else {
            newProjectContainer.css('display', 'none');
        }

        this.initTagSelector(parseInt(value));
    }

    private onSiteLinkClick() {
        this.openTrackerAction();
        this.close();
    }

    private onTaskLinkClick() {
        let url = $('#task-link').attr('href');
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
        let selectedProjectId = Number(selectedProject.id);

        if (!selectedProject || !selectedProject.selected || !selectedProjectId) {
            timer.projectName = ''; // No project
        } else if (selectedProjectId > 0) {
            let project = this._projects.filter(_ => _.projectId == selectedProjectId)[0];
            timer.projectName = project && project.projectName; // Existing project
        } else {
            timer.projectName = $.trim($(this._forms.create + ' .new-project .input').val()); // New project
        }

        // Set description and tags
        timer.isStarted = true;
        timer.description = $(this._forms.create + ' .description .input').val();
        timer.tagNames = $(this._forms.create + ' .tags .input').select().val() || [];

        // Put timer
        this.putTimer(this._accountId, timer).then(() => {

            // Save project map
            let projectName = this._newIssue.projectName || '';
            let newProjectName = timer.projectName || '';
            let newProject = this._projects.find(_ => _.projectName == newProjectName);
            if (newProjectName == projectName) {
                this.saveProjectMapAction({ projectName, projectId: null });
            } else if (newProject) {
                this.saveProjectMapAction({ projectName, projectId: newProject.projectId });
            }

            if (timer.issueId) {
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
    }
}

interface ITagSelection extends Select2SelectionObject {
    isWorkType: boolean;
}

interface IdTextTagType extends IdTextPair {
    isWorkType: boolean;
}