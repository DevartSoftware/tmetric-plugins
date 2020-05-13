interface WebToolIntegration {
    matchUrl?: string | RegExp | (string | RegExp)[];
    match?: (source: Source) => boolean;
    issueElementSelector?: string | string[] | (() => HTMLElement[]);
    observeMutations?: boolean;
    render(issueElement: HTMLElement, linkElement: HTMLElement);
    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue;
    showIssueId: boolean;
}

interface Source {

    /** Full url, e.g. http://rm.devart.local/redmine/issues/58480?tab=tabtime_time#tag */
    fullUrl: string;

    /** Protocol, e.g. http:// */
    protocol: string;

    /** Host, e.g. rm.devart.local */
    host: string;

    /** Path, e.g. /redmine/issues/58480 */
    path: string;
}

interface IntegrationInfo {
    serviceName: string;
    icon: string;
}

interface WebToolIssueIdentifier {
    serviceUrl?: string;
    issueUrl?: string;
}

interface WebToolIssueDuration extends WebToolIssueIdentifier {
    duration: number;
}

interface WebToolIssue extends WebToolIssueIdentifier {
    issueId?: string;
    issueName?: string;
    description?: string;
    serviceType?: string;
    projectName?: string;
    tagNames?: string[];
}

interface WebToolIssueTimer extends WebToolIssue {
    projectId?: number;
    isStarted: boolean;
    showIssueId?: boolean;
}

interface WebToolParsedIssue {
    element: HTMLElement;
    issue: WebToolIssue;
}

interface AjaxStatus {
    statusCode: number;
    statusText: string;
    responseMessage: string;
}

interface ITabInfo {
    url: string;
    title: string;
    issue: WebToolIssue;
}

interface ITabMessage {
    action: string;
    data?: any;
}

interface IPopupRequest {
    action: string;
    data?: any;
}

interface IPopupResponse {
    action: string;
    data?: any;
    error?: string;
}

interface IWindowMessage {
    data: string;
    origin: string;
}

interface ITaskInfo {
    description: string;
    projectId: number;
    tagIds: number[];
}

interface IPopupParams {
    accountId: number;
    includeRecentTasks: boolean;
}

interface IPopupInitData {
    timer: Models.Timer;
    newIssue: WebToolIssueTimer;
    profile: Models.UserProfile;
    accountId: number;
    projects: Models.ProjectLite[];
    clients: Models.Client[];
    tags: Models.Tag[];
    constants: Models.Constants;
    canCreateProjects: boolean;
    canCreateTags: boolean;
    defaultProjectId: number;
    requiredFields: Models.RequiredFields;
}

interface IPopupTimerData {
    timer: WebToolIssueTimer,
    accountId?: number;
}

interface IAccountProjectMapping {
    accountId: number;
    projectName: string;
    projectId: number;
}

interface ITaskDescriptionMapping {
    taskName: string;
    description: string;
}

interface IExtensionSettings {
    showPopup: Models.ShowPopupOption
}

interface IExtensionSettingsMessage {
    action: string;
    data?: any;
}