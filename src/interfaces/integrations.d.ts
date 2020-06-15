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

type ContentScripts = {
    js?: string[];
    css?: string;
    paths?: string[];
    allFrames?: boolean;
    runAt?: string;
};

interface WebTool {
    serviceType: string;
    origins: string[];
}

interface WebToolInfo extends WebTool {
    serviceName: string;
    icon: string;
    keywords?: string;
    hasAdditionalOrigins?: boolean; // means web service have more online or/and self-hosted origins
}

interface WebToolDescription extends WebToolInfo {
    scripts: ContentScripts;
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
    possibleWebTools: WebToolInfo[];
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
    showPopup: Models.ShowPopupOption;
}

interface IExtensionLocalSettings {
    skipPermissionsCheck: boolean;
    webTools: WebTool[];
}

interface IExtensionSettingsMessage {
    action: string;
    data?: any;
}

interface IContentScriptRegistratorMessage {
    action: 'registerContentScripts' | 'unregisterContentScripts';
    data?: string[];
}