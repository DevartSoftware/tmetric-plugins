interface AjaxStatus {
    statusCode: number;
    statusText: string;
}

interface ITabInfo {
    url: string;
    title: string;
    issue: Integrations.WebToolIssue;
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
    issue: Integrations.WebToolIssueTimer;
    timeFormat: string;
    projects: Models.Project[];
    tags: Models.Tag[];
    defaultWorkType: Models.Tag;
    constants: Models.Constants;
    canCreateProjects: boolean;
    canCreateTags: boolean;
}