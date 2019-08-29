var defaultApplicationUrl = 'https://app.tmetric.com';

var popup = null;

function openPopup(url) {
    popup = window.open(url, 'TMetricPopup', 'toolbar=no,scrollbars=no,resizable=no,width=480,height=640,left=0,top=0');
}

function onLoad() {
    
    var popupTimerUrl = defaultApplicationUrl + "/PopupTimer";
    
    function clickHandler(event) {
        openPopup(popupTimerUrl);
        event.preventDefault();
        return false;
    }
    
    var anchor = document.createElement('a');
    anchor.href = popupTimerUrl;
    anchor.innerText = popupTimerUrl;
    (<any>anchor).style = 'position:absolute;top:0;left:0;z-index:1000;background-color:black;color:white';
    anchor.onclick = clickHandler;
    anchor.target = 'TMetricPopup';
    
    document.body.insertBefore(anchor, document.body.firstElementChild);
}

document.addEventListener("DOMContentLoaded", onLoad);
