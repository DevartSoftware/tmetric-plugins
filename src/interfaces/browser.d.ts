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

interface IPopupInitData {
    title: string;
    timer: Models.Timer;
    issue: WebToolIssueTimer;
    timeFormat: string;
    projects: Models.ProjectLite[];
    tags: Models.Tag[];
    defaultWorkType: Models.Tag;
    constants: Models.Constants;
    canCreateProjects: boolean;
    canCreateTags: boolean;
}