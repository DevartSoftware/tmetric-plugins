const integrations = <IntegrationInfo[]>[
    {
        integrationType: "Asana",
        icon: "../images/icon64.png",
    }
];

function renderIntegrations(holder: string) {
    let content = integrations.map(item => $('<span>').attr('title', item.integrationType).append(`<img src="${item.icon}"/>`));
    $(holder).empty().append(content);
}

renderIntegrations('#integrations');

