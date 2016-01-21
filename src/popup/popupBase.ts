class PopupBase {

    callBackground(message: IPopupRequest): Promise<IPopupResponse> {
        return;
    };

    constructor() {
        this.showLoader();
        this.isLoggedIn().then((loggedIn) => {
            if (loggedIn) {
                this.initialize().then((data) => {
                    this.issue = data.issue;
                    this.timer = data.timer;
                    this.showEdit();
                });
            } else {
                this.showLogin();
            }
        });
    }

    private profile: Models.UserProfile;
    private projects: Models.Project[];
    private tags: Models.Tag[];
    private timer: Models.Timer;
    private issue: Integrations.WebToolIssue;

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

    initialize = this.wrapBackgroundAction<void, IPopupInitData>('initialize');
    isLoggedIn = this.wrapBackgroundAction<void, boolean>('isLoggedIn');
    login = this.wrapBackgroundAction<void, any>('login');
    getTimer = this.wrapBackgroundAction<void, Integrations.WebToolIssueTimer>('getTimer');
    start = this.wrapBackgroundAction<void, void>('start');
    stop = this.wrapBackgroundAction<void, void>('stop');
    apply = this.wrapBackgroundAction<void, void>('apply');

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

    // ui mutations

    showBlank() {
        $('content').attr('class', 'blank');
    }

    showLoader() {
        $('content').attr('class', 'loading');
    }

    showLogin() {
        $('content').attr('class', 'authenticating');
    }

    showEdit() {
        $('content').attr('class', 'editing');
    }

    updateEdit() {

        var task = '';
        var projectSelectedFilter: Function;

        var isStarted = false, workTask: Models.WorkTask;

        var timer = this.timer;
        var issue = this.issue;

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
    }

    makeProjectOptions(selectedFilter: Function): HTMLOptionElement[] {
        return this.projects.map((project) => {
            return new Option(project.projectName, '' + project.projectId, false, selectedFilter ? selectedFilter(project) : false);
        });
    }

    makeTagOptions() {
        return this.tags.map((tag) => {
            return new Option(tag.tagName, '' + tag.tagId);
        });
    }

    // ui event handlers

    initControls() {

        $('#login').click(() => this.login());
        $('#start').click(() => this.start());
        $('#stop').click(() => this.stop());
        $('#apply').click(() => this.apply());

        $('#project').select2();
        $('#tags').select2();
    }
}