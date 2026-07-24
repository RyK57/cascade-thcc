import MWDATCore
import SwiftUI

@main
struct CascadeGlassesApp: App {
    init() {
        try? Wearables.configure()
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
