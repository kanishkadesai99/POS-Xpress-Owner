//  AppDelegate.swift
//  RN Softwares – React Native iOS bootstrap
//
//  This version wires up a reliable JS bundle URL so Debug uses Metro
//  and Release loads the embedded main.jsbundle.

import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  private var reactNativeDelegate: ReactNativeDelegate?
  private var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // Set up RN new-arch factory & delegate
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // Create the window and start RN
    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Pmsxpresso",   // <-- your RN module name
      in: window,
      launchOptions: launchOptions
    )

    window?.makeKeyAndVisible()
    return true
  }
}

/// Ensures a valid JS bundle URL for both Debug (Metro) and Release (embedded).
final class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

  override func bundleURL() -> URL? {
#if DEBUG
    // You can override these via scheme environment variables if needed
    let env = ProcessInfo.processInfo.environment
    let host = env["RCT_METRO_HOST"] ?? "localhost"
    let port = env["RCT_METRO_PORT"] ?? "8081"

    // Tell RN where Metro is running, then ask it for the URL
    let provider = RCTBundleURLProvider.sharedSettings()
    provider.jsLocation = "\(host):\(port)"

    // RN 0.75+: API with optional fallback extension
    if let url = provider.jsBundleURL(forBundleRoot: "index", fallbackExtension: nil) {
      NSLog("RN bundle URL (DEBUG) = %@", url.absoluteString)
      return url
    }
    // Fallback for older APIs
    let legacyURL = provider.jsBundleURL(forBundleRoot: "index")
    NSLog("RN bundle URL (DEBUG-legacy) = %@", legacyURL?.absoluteString ?? "nil")
    return legacyURL
#else
    // Release uses the embedded JS bundle produced by the build phase script
    let url = Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    NSLog("RN bundle URL (RELEASE) = %@", url?.absoluteString ?? "nil")
    return url
#endif
  }
}
