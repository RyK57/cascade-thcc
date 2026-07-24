import MWDATCore
import SwiftUI

/// Surfaces the SDK bootstrap error in the UI instead of swallowing it.
enum DATBootstrap {
    nonisolated(unsafe) static var error: String?
}

@main
struct CascadeGlassesApp: App {
    init() {
        do {
            try Wearables.configure()
        } catch {
            DATBootstrap.error = "\(error)"
            print("Wearables.configure failed: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    // Return leg of DAT registration via our URL scheme.
                    guard
                        let components = URLComponents(
                            url: url, resolvingAgainstBaseURL: false
                        ),
                        components.queryItems?.contains(where: {
                            $0.name == "metaWearablesAction"
                        }) == true
                    else { return }
                    Task { _ = try? await Wearables.shared.handleUrl(url) }
                }
        }
    }
}
