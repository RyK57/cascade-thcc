import Foundation
import MWDATCamera
import MWDATCore
import UIKit

/// Meta Wearables DAT integration: registration, device session, and photo
/// capture from the glasses camera. Falls back to the phone's rear camera
/// when no glasses are connected so the loop works without hardware.
@MainActor
final class GlassesManager: ObservableObject {
    @Published var isConnected = false
    @Published var statusText = "Glasses: not connected" {
        didSet { print("[cascade-glasses] \(statusText)") }
    }

    private var session: DeviceSession?
    private var selector: AutoDeviceSelector?
    private var stream: MWDATCamera.Stream?
    private var tokens: [any AnyListenerToken] = []
    private var photoContinuation: CheckedContinuation<UIImage?, Never>?
    private let phoneFallback = PhoneCameraFallback()

    /// Observe registration + device changes. Wearables.configure() runs in
    /// the App initializer before this.
    func configure() {
        if let bootError = DATBootstrap.error {
            statusText = "SDK init failed: \(bootError)"
            return
        }
        statusText = "Glasses: SDK ready (\(Wearables.shared.registrationState))"
        Task {
            for await state in Wearables.shared.registrationStateStream() {
                updateStatus(registration: state)
            }
        }
    }

    private func updateStatus(registration: RegistrationState) {
        switch registration {
        case .registered:
            if !isConnected { statusText = "Glasses: registered — tap Connect" }
        case .registering:
            statusText = "Glasses: registering…"
        case .available:
            statusText = "Glasses: tap Connect to register"
        case .unavailable:
            statusText = "Glasses: install/open Meta AI app"
        @unknown default:
            statusText = "Glasses: unknown state"
        }
    }

    func toggleConnection() {
        if isConnected {
            disconnect()
        } else {
            Task { await connect() }
        }
    }

    func connect() async {
        do {
            if Wearables.shared.registrationState != .registered {
                statusText =
                    "Opening Meta AI app to register… (state: \(Wearables.shared.registrationState))"
                do {
                    try await Wearables.shared.startRegistration()
                } catch {
                    statusText = "Registration failed: \(error)"
                    return
                }
                for await state in Wearables.shared.registrationStateStream() {
                    statusText = "Registration: \(state)"
                    if state == .registered { break }
                }
            }

            var permission = try await Wearables.shared.checkPermissionStatus(.camera)
            if permission != .granted {
                permission = try await Wearables.shared.requestPermission(.camera)
            }
            guard permission == .granted else {
                statusText = "Glasses: camera permission denied in Meta AI app"
                return
            }

            let wearables = Wearables.shared
            let deviceCount = wearables.devices.count
            statusText = "Devices seen: \(deviceCount) — checking compatibility…"
            if deviceCount == 0 {
                statusText =
                    "Devices seen: 0 — open Meta AI app, confirm glasses show Connected, and check Cascade's Bluetooth + Local Network toggles in iOS Settings."
                return
            }

            // Diagnose each visible device before trying a session.
            var deviceInfo = ""
            for identifier in wearables.devices {
                guard let device = wearables.deviceForIdentifier(identifier)
                else { continue }
                let compat = device.compatibility()
                let link = device.linkState
                deviceInfo =
                    "\(device.nameOrId()): link=\(link), compat=\(compat.displayString)"
                statusText = deviceInfo
                if compat == .deviceUpdateRequired {
                    statusText =
                        "\(device.nameOrId()) needs a glasses software update — opening Meta AI update screen…"
                    try? await Wearables.shared.openFirmwareUpdate()
                    return
                }
                if compat == .sdkUpdateRequired {
                    statusText =
                        "\(device.nameOrId()): app SDK too old for this device (sdkUpdateRequired)."
                    return
                }
                if link == .disconnected {
                    statusText =
                        "\(device.nameOrId()) is paired but disconnected — wake the glasses (open hinges/wear them) and check Meta AI shows Connected."
                    return
                }
            }
            // The selector resolves its active device asynchronously — creating
            // a session before it resolves throws noEligibleDevice (per Meta's
            // sample, which monitors activeDeviceStream before getSession).
            let selector = self.selector ?? AutoDeviceSelector(wearables: wearables)
            self.selector = selector
            var waited = 0
            while selector.activeDevice == nil && waited < 24 {
                statusText = "Waiting for glasses to become active… \(waited / 2)s"
                try? await Task.sleep(for: .milliseconds(500))
                waited += 1
            }
            guard selector.activeDevice != nil else {
                statusText =
                    "Glasses visible but never became the active device (10s). Close other glasses apps, toggle the glasses off/on in Meta AI, then retry.\n\(wearablesDeviceSummary())"
                return
            }

            let session = try wearables.createSession(deviceSelector: selector)
            // Capture the stream before start() — no replay on state events.
            let states = session.stateStream()
            try session.start()
            if session.state != .started {
                for await state in states {
                    if state == .started { break }
                    if state == .stopped {
                        statusText = "Glasses: session stopped — is a device paired?"
                        return
                    }
                }
            }
            self.session = session
            isConnected = true
            statusText = "Glasses: connected"
        } catch {
            // Keep the device diagnostics visible alongside the failure.
            let info = wearablesDeviceSummary()
            statusText = "Glasses: \(error.localizedDescription)\n\(info)"
        }
    }

    private func wearablesDeviceSummary() -> String {
        let wearables = Wearables.shared
        let parts = wearables.devices.compactMap { identifier -> String? in
            guard let device = wearables.deviceForIdentifier(identifier)
            else { return nil }
            return "\(device.nameOrId()): link=\(device.linkState), compat=\(device.compatibility().displayString)"
        }
        return parts.isEmpty ? "(no devices visible)" : parts.joined(separator: " · ")
    }

    func disconnect() {
        stream?.stop()
        stream = nil
        session?.stop()
        session = nil
        tokens.removeAll()
        isConnected = false
        statusText = "Glasses: not connected"
    }

    /// Photo from the glasses camera when connected; phone camera otherwise.
    func capturePhoto() async -> UIImage? {
        guard isConnected, let session else {
            return await phoneFallback.capture()
        }
        do {
            let stream = try ensureStream(session: session)
            return await withCheckedContinuation { continuation in
                photoContinuation = continuation
                if !stream.capturePhoto(format: .jpeg) {
                    photoContinuation = nil
                    continuation.resume(returning: nil)
                    return
                }
                // Photo arrives on photoDataPublisher; guard with a timeout.
                Task { @MainActor [weak self] in
                    try? await Task.sleep(for: .seconds(12))
                    if let pending = self?.photoContinuation {
                        self?.photoContinuation = nil
                        pending.resume(returning: nil)
                    }
                }
            }
        } catch {
            statusText = "Glasses: \(error.localizedDescription)"
            return await phoneFallback.capture()
        }
    }

    private func ensureStream(
        session: DeviceSession
    ) throws -> MWDATCamera.Stream {
        if let stream, stream.state == .streaming { return stream }

        let config = StreamConfiguration(
            videoCodec: .raw, resolution: .low, frameRate: 24
        )
        guard let stream = try session.addStream(config: config) else {
            throw NSError(
                domain: "Cascade", code: 1,
                userInfo: [
                    NSLocalizedDescriptionKey: "Session not started yet"
                ]
            )
        }

        tokens.append(
            stream.photoDataPublisher.listen { [weak self] photoData in
                Task { @MainActor in
                    guard let self, let pending = self.photoContinuation else {
                        return
                    }
                    self.photoContinuation = nil
                    pending.resume(returning: UIImage(data: photoData.data))
                }
            }
        )
        tokens.append(
            stream.errorPublisher.listen { [weak self] error in
                Task { @MainActor in
                    self?.statusText = "Glasses stream: \(error)"
                }
            }
        )

        stream.start()
        self.stream = stream
        return stream
    }
}
