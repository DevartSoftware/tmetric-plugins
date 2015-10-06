interface Utils {
    (selector: string, element?: NodeSelector, returnEmptyObject?: boolean): HTMLElement;
    (selector: string, returnEmptyObject?: boolean, element?: NodeSelector): HTMLElement;
    create(tagName: string, className?: string): HTMLElement;
    all(selector: string, element?: NodeSelector): HTMLElement[];
}

var $$ = <Utils>function(selector: string, param1?: any, param2?: any): HTMLElement
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

$$.create = function(tagName, className) {
    var element = document.createElement(tagName);
    element.classList.add(Integrations.IntegrationService.affix + '-' + tagName.toLowerCase());
    if (className) {
        element.classList.add(className);
    }
    return element;
}

$$.all = function(selector, element?): HTMLElement[]
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