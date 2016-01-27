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

interface IPopupData {
    issue: Integrations.WebToolIssue;
    timer: Models.Timer;
    timerTagsIds: number[];
    projects: Models.Project[];
    tags: Models.Tag[];
}