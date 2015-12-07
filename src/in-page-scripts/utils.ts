interface Utils {
    <TElement extends HTMLElement>(selector: string, element?: NodeSelector, returnEmptyObject?: boolean): TElement;
    <TElement extends HTMLElement>(selector: string, returnEmptyObject?: boolean, element?: NodeSelector): TElement;
    visible<TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement;
    all<TElement extends HTMLElement>(selector: string, element?: NodeSelector): TElement[];
    create<TElement extends HTMLElement>(tagName: string, className?: string): TElement;
}

var $$ = <Utils>function (selector: string, param1?: any, param2?: any): HTMLElement {
    var element = <NodeSelector>param1;
    if (!element || !element.querySelector) {
        element = <NodeSelector>param2;
        if (!element || !element.querySelector) {
            element = document;
        }
    }

    var result = <HTMLElement>element.querySelector(selector);
    if (result) {
        return result;
    }

    if (param1 === true || param2 === true) {
        return <HTMLElement>{};
    }
}

$$.create = function (tagName, className) {
    var element = document.createElement(tagName);
    element.classList.add(Integrations.IntegrationService.affix + '-' + tagName.toLowerCase());
    if (className) {
        element.classList.add(className);
    }
    return element;
}

$$.all = function (selector, element?): HTMLElement[] {
    element = element || document;
    var nodeList = element.querySelectorAll(selector);
    var result = [];
    for (var i = 0; i < nodeList.length; i++) {
        result.push(nodeList[i]);
    }
    return result;
}

$$.visible = <Utils>function (selector: string, element?: NodeSelector): HTMLElement {
    function isVisible(element: HTMLElement): boolean {
        if (!element || element.style.display === 'none' || element.style.visibility === 'hidden') {
            return false;
        }
        return element === document.body || isVisible(element.parentElement);
    }
    return $$.all(selector, element).filter(isVisible)[0];
}