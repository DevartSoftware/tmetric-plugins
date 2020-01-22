//
//  SafariExtensionHandler.swift
//  TMetric for Safari Extension
//
//  Created by test2 on 8/28/19.
//  Copyright © 2019 Devart. All rights reserved.
//

import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").
        page.getPropertiesWithCompletionHandler { properties in
//            NSLog("The extension received a message (\(messageName)) from a script injected into (\(String(describing: properties?.url))) with userInfo (\(userInfo ?? [:]))")
        }
    }
    
    private func findTabWithActivePage(window: SFSafariWindow, url: URL) -> SFSafariTab? {
        
        var tabWithActivePageWithUrl: SFSafariTab?
        let semafore = DispatchSemaphore(value: 0)
        
        window.getAllTabs(completionHandler: { tabs in

            if (tabs.count > 0) {

                let dispatchGroup = DispatchGroup()

                tabs.forEach({ tab in

                    dispatchGroup.enter()
                    
                    DispatchQueue.global().async {
                        
                        tab.getActivePage(completionHandler: { page in

                            if (page != nil) {
                            
                                page?.getPropertiesWithCompletionHandler({ properties in

                                    if (tabWithActivePageWithUrl == nil &&
                                        properties?.url?.scheme == url.scheme &&
                                        properties?.url?.host == url.host &&
                                        properties?.url?.port == url.port &&
                                        properties?.url?.path == url.path
                                    ) {
                                        tabWithActivePageWithUrl = tab
                                    }
                                    
                                    dispatchGroup.leave()
                                    
                                })
                                
                            }
                            
                        })
                        
                    }
                    
                })

                dispatchGroup.notify(queue: .main) {
                    semafore.signal()
                }

            }
            
        })

        _ = semafore.wait(timeout: .distantFuture)
        
        return tabWithActivePageWithUrl
        
    }

    override func toolbarItemClicked(in window: SFSafariWindow) {
//        NSLog("toolbarItemClicked")

        let appUrl = URL(string: "https://app.tmetric.com/")
        let idUrl = URL(string: "https://id.tmetric.com/core/login")
        
        DispatchQueue.global(qos: .userInitiated).async {

            var tab = self.findTabWithActivePage(window: window, url: appUrl!)
            
            if (tab == nil) {
                tab = self.findTabWithActivePage(window: window, url: idUrl!)
            }
            
            if (tab == nil) {
//                NSLog("toolbarItemClicked tab not found")
                window.openTab(with: appUrl!, makeActiveIfPossible: true, completionHandler: { tab in })
            } else {
//                NSLog("toolbarItemClicked tab found")
                tab?.activate(completionHandler: { })
            }
        }
    }
    
    override func validateToolbarItem(in window: SFSafariWindow, validationHandler: @escaping ((Bool, String) -> Void)) {
        // This is called when Safari's state changed in some way that would require the extension's toolbar item to be validated again.
        validationHandler(true, "")
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }

}
