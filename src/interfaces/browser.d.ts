interface AjaxResult<T>
{
    statusCode: number;
    statusText: string;
    data?: T;
}

interface AjaxCallback<T>
{
    (result: AjaxResult<T>): void;
}

interface ITabInfo
{
    url: string;
    title: string;
    issue: Integrations.WebToolIssue;
}

interface ITabMessage
{
    action: string;
    data?: any;
}