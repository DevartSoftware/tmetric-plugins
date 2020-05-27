$(document).ready(() => {

    function renderIntegrations(holder: string, integrations: Integration[]) {
        let content = integrations.map(item => $('<li>')
            .attr('title', item.serviceName)
            .append(`
<label class="logo-wrapper">
  <input type="checkbox" name="${item.serviceName}" />
  <span class="logo-area">
    <img src="../images/integrations/${item.icon}" alt="${item.serviceName}" />
  </span>
</label>`));
        $(holder).empty().append(content);
    }

    function setScrollArea() {
        let headerHeight = $('.header').outerHeight();
        let filterHeight = $('.filter-section').outerHeight();
        let bodyHeight = $(document).height();
        let containerMargins = 82;
        let scrollAreaHeight = bodyHeight - containerMargins - headerHeight - filterHeight;
        $('.logos-section').css("height", scrollAreaHeight + "px");
    }

    function showPopup() {
        $('.logo-wrapper').click(function () {
            if ($(this).children('input:checkbox').prop('checked')) {
                //$(this).addClass('active');
                //$('.location-popup, .overlay').addClass('visible');
            }
        });

        $('.close-popup').click(function () {
            $('.location-popup, .overlay').removeClass('visible');
            $('.logo-wrapper.active').removeClass('active').find('input:checkbox').prop('checked', false);
        });

        $('.show-confirm').click(function () {
            $('.location-popup, .overlay').removeClass('visible');
            $('.logo-wrapper.active').removeClass('active').find('input:checkbox').prop('checked', true);
        });
    }

    function setAllLogos() {
        $('.enable-all').click(function () {
            $('.logos-list input:checkbox').each(function () {
                $(this).prop('checked', true);
            })
        });

        $('.disable-all').click(function () {
            $('.logos-list input:checkbox').each(function () {
                $(this).prop('checked', false);
            })
        });
    }

    function initPermissionCheckboxes() {
        $('.logo-wrapper input').change(event => {

            let input = <HTMLInputElement>event.currentTarget;
            let name = input.name;
            let integration = integrations.find(i => i.serviceName == name);

            try {
                if (input.checked) {
                    requestPermissions(integration);
                }
                else {
                    removePermissions(integration);
                }
            } catch (err) {
                console.error(err);
            }
        });

        updatePermissionCheckboxes();
    }

    function updatePermissionCheckboxes() {
        integrations.forEach(integration => {

            if (!integration.origins || !integration.origins.length) {
                return;
            }

            let permissions = <chrome.permissions.Permissions>{
                origins: integration.origins
            };

            chrome.permissions.contains(permissions, result => {
                $(`.logo-wrapper input[name='${integration.serviceName}']`).prop('checked', result);
            });
        });
    }

    function requestPermissions(integration: Integration) {

        let permissions = <chrome.permissions.Permissions>{
            origins: integration.origins
        };

        chrome.permissions.request(permissions, result => {
            updatePermissionCheckboxes();
            if (result) {
                registerScripts(integration);
            }
        });
    }

    function removePermissions(integration: Integration) {

        let permissions = <chrome.permissions.Permissions>{
            origins: integration.origins
        };

        chrome.permissions.remove(permissions, result => {
            updatePermissionCheckboxes();
            if (result) {
                unregisterScripts(integration);
            }
        });
    }

    function registerScripts(integration: Integration) {

        let message = <IIntegrationMessage>{
            action: 'registerIntegrationScripts',
            data: integration.serviceType
        };

        chrome.runtime.sendMessage(message, () => { });
    }

    function unregisterScripts(integration: Integration) {

        let message = <IIntegrationMessage>{
            action: 'unregisterIntegrationScripts',
            data: integration.serviceType
        };

        chrome.runtime.sendMessage(message, () => { });
    }

    // init

    const integrations = getIntegrations().filter(i => i.serviceType && i.scripts);
    renderIntegrations('#integrations', integrations);

    setScrollArea();
    setAllLogos();
    showPopup();

    initPermissionCheckboxes();

    $(window).resize(function () {
        setScrollArea();
    });

});
