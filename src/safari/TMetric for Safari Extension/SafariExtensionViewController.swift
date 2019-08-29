//
//  SafariExtensionViewController.swift
//  TMetric for Safari Extension
//
//  Created by test2 on 8/28/19.
//  Copyright © 2019 Devart. All rights reserved.
//

import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    
    static let shared: SafariExtensionViewController = {
        let shared = SafariExtensionViewController()
        shared.preferredContentSize = NSSize(width:320, height:240)
        return shared
    }()

}
