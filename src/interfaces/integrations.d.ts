interface WebToolIntegration {
    matchUrl?: string | RegExp | (string | RegExp)[];
    match?: (source: Source) => boolean | undefined;
    observeMutations?: boolean;
    showIssueId?: boolean;
    canBeRenderedRepeatedly?: boolean;
    issueElementSelector?: string | string[] | (() => (HTMLElement | null)[]);
    render(issueElement: HTMLElement | null, linkElement: HTMLElement);
    getIssue(issueElement: HTMLElement | null, source: Source): WebToolIssue | undefined;
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
    css?: string[];
    allFrames?: boolean;
    runAt?: 'document_start' | 'document_end' | 'document_idle';
};

interface WebTool {
    serviceType: string;
    origins: string[];
}

interface WebToolInfo extends WebTool {

    serviceName: string;

    icon: string;

    keywords?: string;

    /** Flag indicating that service has online or/and self-hosted urls not listed in property WebTool.origins */
    hasAdditionalOrigins?: boolean;

    /** Flag indicating that service requires all origins listed in property WebTool.origins */
    allOriginsRequired?: boolean; // means
}

interface WebToolDescription extends WebToolInfo {
    scripts: ContentScripts;
    embeddedScripts?: ContentScripts;
}

interface WebToolIssueIdentifier {
    serviceUrl?: string | null;
    issueUrl?: string | null;
}

interface WebToolIssueDuration extends WebToolIssueIdentifier {
    duration: number;
}

interface WebToolIssue extends WebToolIssueIdentifier {
    issueId?: string | null;
    issueName?: string | null;
    description?: string | null;
    serviceType?: string | null;
    projectName?: string | null;
    tagNames?: (string | null | undefined)[] | null;
}

interface WebToolIssueTimer extends WebToolIssue {
    tagNames?: string[] | null;
    projectId?: number;
    isStarted: boolean;
    showIssueId?: boolean;
}

interface WebToolParsedIssue {
    element: HTMLElement | null;
    issue: WebToolIssue;
}

interface AjaxStatus {
    statusCode: number;
    statusText: string;
    responseMessage: string;
}

type TabMessageAction =
    | 'ping'
    | 'getConstants'
    | 'getTimer'
    | 'putTimer'
    | 'getIssuesDurations';

interface ITabMessage {
    action: TabMessageAction;
    data?: any;
}

type TabMessageCallbackAction = `${TabMessageAction}_callback`
    | 'setTimer'
    | 'setIssuesDurations'
    | 'setConstants'
    | 'showPopup'
    | 'hidePopup'
    | 'initPage';

interface ITabCallbackMessage {
    action: TabMessageCallbackAction;
    data?: any;
}

interface IPermissionRequest {
    sender: 'permission',
    action: 'originsAdded' | 'originsRemoved';
    data: string[];
}

type PopupRequestAction =
    | 'initialize'
    | 'openTracker'
    | 'openPage'
    | 'login'
    | 'isConnectionRetryEnabled'
    | 'retry'
    | 'fixTimer'
    | 'putTimer'
    | 'saveProjectMap'
    | 'saveDescriptionMap'
    | 'openOptionsPage'
    | 'getRecentTasks'
    | 'hideAllPopups';

interface IPopupRequest {
    sender: 'popup',
    action: PopupRequestAction;
    data?: any;
}

interface IExtensionSettingsMessage {
    sender: 'settings',
    action: 'getIntegratedServices';
    data?: any;
}

interface IMessageResponse {
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
    accountId: number | null;
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
    possibleWebTool: WebToolInfo;
}

interface IPopupTimerData {
    timer: WebToolIssueTimer,
    accountId?: number;
}

interface IAccountProjectMapping {
    accountId: number;
    projectName: string;
    projectId: number | null;
    serviceType: string | null | undefined;
}

interface ITaskDescriptionMapping {
    taskName: string;
    description: string;
}

interface IExtensionSettings {
    showPopup: Models.ShowPopupOption;
}

interface ServiceTypesMap {
    [serviceUrl: string]: string;
}

interface ServiceUrlsMap {
    [serviceType: string]: string[];
}

interface IExtensionLocalSettings {
    skipPermissionsRequest: boolean;
    serviceTypes: ServiceTypesMap
}
