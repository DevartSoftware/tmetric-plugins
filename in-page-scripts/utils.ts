function $$(selector: string, element?: NodeSelector, returnEmptyObject?: boolean): HTMLElement
function $$(selector: string, returnEmptyObject?: boolean, element?: NodeSelector): HTMLElement
function $$(selector: string, param1?: any, param2?: any): HTMLElement
{
    var element = <NodeSelector>param1;
    if (!element || !element.querySelector)
    {
        element = <NodeSelector>param2;
        if (!element || !element.querySelector)
        {
            element = document;
        }
    }

    var result = <HTMLElement>element.querySelector(selector);
    if (result)
    {
        return result;
    }

    if (param1 === true || param2 === true)
    {
        return <HTMLElement>{};
    }
}

function $$all(selector: string, element?: NodeSelector): HTMLElement[]
{
    element = element || document;
    var nodeList = element.querySelectorAll(selector);
    var result = [];
    for (var i = 0; i < nodeList.length; i++)
    {
        result.push(nodeList[i]);
    }
    return result;
}