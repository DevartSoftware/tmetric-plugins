class PopupController {

    constructor() {
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
    private _constants: Models.Constants;
    private _canCreateProjects: boolean;
    private _canCreateTags: boolean;
    private _newIssue: WebToolIssueTimer;

    protected isPagePopup = false;

    getData(accountId: number) {

        this.switchState(this._states.loading);

        return this.initializeAction(accountId).then(data => {
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
                this.switchState(this._states.viewing);
            } else {
                this.fillCreateForm(data.defaultProjectId);
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
            this._accountId = data.accountId;
            this._projects = data.projects;
            this._clients = data.clients;
            this._tags = data.tags.filter(tag => !!tag).sort((a, b) => this.compareTags(a, b));
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

    initializeAction = this.wrapBackgroundAction<number, IPopupInitData>('initialize');
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
                .prop('data-value', _.account.accountId)
                .text(_.account.accountName);
            return item;
        });

        menu.append(items);

        dropdown.show();
    }

    private changeAccount(accountId: number) {
        let state = $('content').attr('class');
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

    fillViewForm(timer: Models.Timer, accountId: number) {

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
        } else if (details.projectTask) {
            // internal tmetric task
            let url = `${this._constants.serviceUrl}/#/tasks/${accountId}'?id=${details.projectTask.projectTaskId}`;
            let a = $(this._forms.view + ' .task .id .link').attr('href', url);
            a.addClass('fa fa-external-link');
        } else {
            $(this._forms.view + ' .task .id').hide();
        }

        if (details.projectTask) {
            $(this._forms.view + ' .task')
                .attr('title', details.projectTask.description)
                .find('.name')
                .text(details.projectTask.description);

            // not show custom description if equals to default task description
            if (details.projectTask.description == details.description) {
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

    fillCreateForm(defaultProjectId: number) {

        let taskInput = $(this._forms.create + ' .task .input');
        taskInput.attr('maxlength', Models.Limits.maxTask);

        if (this._newIssue.issueId) {
            $(this._forms.create + ' .task .label').text('Notes');
            taskInput.attr('placeholder', 'Describe your activity');
            $(this._forms.create + ' .task-description').css('display', 'inline-flex');
            $(this._forms.create + ' .task-description .issueId').text(this._newIssue.issueId);
            $(this._forms.create + ' .task-description .description').text(this._newIssue.issueName);
            taskInput.val(this._newIssue.description);
        } else {
            taskInput.val(this._newIssue.description || this._newIssue.issueName);
        }

        // Force focus on current window (for Firefox)
        $(window).focus();
        taskInput.focus().select();

        this.initProjectSelector(this._forms.create + ' .project .input', this.makeProjectItems(), defaultProjectId);
        $(this._forms.create + ' .new-project .input').attr('maxlength', Models.Limits.maxProjectName);

        this.initTagSelector(this._forms.create + ' #tag-selector', this.makeTagItems(), this.makeTagSelectedItems(), this._canCreateTags);
        $(this._forms.create + ' .tags .select2-search__field').attr('maxlength', Models.Limits.maxTag);

        // Do not focus project in extension popup (TE-117, TE-221)
        if (this.isPagePopup && this._newIssue.issueName) {
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

    private noProjectOption: IdTextPair = { id: 0, text: 'No project' };

    private createProjectOption: IdTextPair = { id: -1, text: 'New project' };

    makeProjectItems() {
        let projects = <IdTextPair[]>[];
        if (this._canCreateProjects) {
            projects.push(this.createProjectOption);
        }
        projects.push(this.noProjectOption);
        return projects.concat(this._projects.map(project => {
            let projectCode = project.projectCode ? ` [${project.projectCode}]` : '';
            let projectClient = project.clientId ? ` / ${this.getClient(project.clientId).clientName}` : '';
            return <IdTextPair>{ id: project.projectId, text: project.projectName + projectCode + projectClient };
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

    initProjectSelector(selector: string, items: IdTextPair[], defaultProjectId: number) {

        if (!defaultProjectId) {

            defaultProjectId = this.noProjectOption.id;

            // Find project if it is specified in new issue (TE-219)
            let newProjectName = this._newIssue && this._newIssue.projectName;
            let existingProject = newProjectName && items.find(item =>
                item.id > 0 && item.text.toLowerCase() == newProjectName.toLowerCase());

            if (existingProject) {
                defaultProjectId = existingProject.id; // Select existing project (TE-215)
            } else if (this.isPagePopup && this._canCreateProjects && newProjectName) {
                defaultProjectId = this.createProjectOption.id; // Select new project
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

        let result = $('<span class="flex-container-with-overflow" />');
        let namesElement = $('<span class="text-overflow" />');

        // Find project
        let projectId = parseInt(data.id)
        let project = this.getProject(projectId);
        let projectName = project ? project.projectName : data.text;

        let projectCode: string;
        let projectClient: string;
        if (project) {
            projectCode = project.projectCode ? ` [${project.projectCode}]` : '';
            projectClient = project.clientId ? ` / ${this.getClient(project.clientId).clientName}` : '';
        }

        let projectAvatar = project && project.avatar || 'Content/Avatars/project.svg';

        // Add project name
        let projectNameElement = $('<span class="text-overflow">').text(projectName);

        namesElement.append(projectNameElement);

        // Add avatar
        let avatarPath = `${this._constants.serviceUrl}/${projectAvatar}`
        let avatarElement = $(`<img src="${avatarPath}" />`).addClass('project-avatar-image');

        let title = projectName;

        if (projectCode) {
            let projectCodeElement = $('<span />').text(projectCode);
            namesElement.append(projectCodeElement);
            title += projectCode;
        }

        if (projectClient) {
            let projectClientElement = $('<span class="text-muted" />').text(projectClient);
            namesElement.append(projectClientElement);
            title += projectClient;
        }

        $(namesElement).attr('title', title);
        result.append(avatarElement);
        result.append(namesElement);

        return result;
    }

    initTagSelector(selector: string, items: IdTextPair[], selectedItems: string[], allowNewItems?: boolean) {
        $(selector)
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
        $('#settings-btn').click(() => (this.onSettingsClick(), false));

        this.initDropdown('#account-selector', (accountId) => {
            this.changeAccount(accountId);
        });

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

        function toggleDropdown(open: boolean) {
            dropdown.toggleClass('open', open);
            toggleIcon.toggleClass('fa-angle-up', open);
            toggleIcon.toggleClass('fa-angle-down', !open);
        }

        $(document.body).click(event => {
            if (!$(event.target).closest(dropdown).length) {
                toggleDropdown(false);
            }
        });

        toggle.click(() => {
            let isOpen = dropdown.hasClass('open');
            toggleDropdown(!isOpen);
        });

        $(menu).click(event => {
            if (!$(event.target).hasClass('dropdown-menu-item')) {
                return;
            }
            let value = $(event.target).prop('data-value');
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
        if (!selectedProject || !selectedProject.selected || !Number(selectedProject.id)) {
            timer.projectName = ''; // No project
        } else if (Number(selectedProject.id) > 0) {
            timer.projectName = selectedProject.text; // Existing project
        } else {
            timer.projectName = $.trim($(this._forms.create + ' .new-project .input').val()); // New project
        }

        // Set description and tags
        timer.isStarted = true;
        timer.description = $(this._forms.create + ' .task .input').val();
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
}

interface ITagSelection extends Select2SelectionObject {
    isWorkType: boolean;
}

interface IdTextTagType extends IdTextPair {
    isWorkType: boolean;
}