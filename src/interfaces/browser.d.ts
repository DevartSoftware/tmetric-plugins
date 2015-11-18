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