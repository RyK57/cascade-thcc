import SwiftUI

struct ContentView: View {
    @StateObject private var speech = SpeechManager()
    @StateObject private var glasses = GlassesManager()
    @StateObject private var location = LocationProvider()

    @AppStorage("cascadeBaseURL") private var baseURL = "https://YOUR-DEPLOY.vercel.app"
    @AppStorage("cascadeHandle") private var handle = "+1"
    @AppStorage("cascadeToken") private var token = ""

    @State private var reply = ""
    @State private var busy = false
    @State private var lastCapture: UIImage?
    @State private var lastCaptionPost = Date.distantPast

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    glassesCard
                    handsFreeCard
                    talkCard
                    if !speech.transcript.isEmpty {
                        Text("“\(speech.transcript)”")
                            .font(.body.italic())
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    if let image = lastCapture {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 180)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    if !reply.isEmpty {
                        Text(reply)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(.orange.opacity(0.12))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    settingsCard
                }
                .padding()
            }
            .navigationTitle("Cascade Glasses")
        }
        .onAppear {
            speech.requestPermissions()
            glasses.configure()
            location.start()
        }
        // Stream partial transcripts to the HUD live-caption bar (~2/sec).
        .onChange(of: speech.transcript) { _, transcript in
            guard speech.isRecording, !transcript.isEmpty,
                  Date().timeIntervalSince(lastCaptionPost) > 0.5
            else { return }
            lastCaptionPost = Date()
            let base = baseURL.trimmingCharacters(in: .whitespaces)
            let phone = handle.trimmingCharacters(in: .whitespaces)
            Task {
                await CascadeAPI.postTranscript(
                    baseURL: base, handle: phone, text: transcript
                )
            }
        }
    }

    private var glassesCard: some View {
        VStack(spacing: 8) {
            HStack {
                Circle()
                    .fill(glasses.isConnected ? .green : .gray)
                    .frame(width: 10, height: 10)
                Text(glasses.statusText)
                Spacer()
                Button(glasses.isConnected ? "Disconnect" : "Connect") {
                    glasses.toggleConnection()
                }
            }
            Button {
                Task { await captureAndSend() }
            } label: {
                Label("Capture what I'm seeing", systemImage: "camera")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.borderedProminent)
            .disabled(busy)
        }
        .padding()
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var handsFreeCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Toggle(isOn: Binding(
                get: { speech.handsFree },
                set: { enabled in
                    speech.onUtterance = { heard in
                        Task { await handleHandsFreeUtterance(heard) }
                    }
                    speech.setHandsFree(enabled)
                }
            )) {
                Label("Hands-free — say “Cascade …”", systemImage: "ear")
                    .font(.headline)
            }
            if speech.handsFree {
                Text(
                    "Phone can stay in your pocket. Say “Cascade, find someone to…” then pause. Say “Cascade, yes” to approve."
                )
                .font(.footnote)
                .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    /// Wake-word gate: only utterances addressed to "Cascade" are sent.
    private func handleHandsFreeUtterance(_ heard: String) async {
        let lower = heard.lowercased()
        guard let range = lower.range(of: "cascade") else {
            speech.restartHandsFreeListening(after: 0.2)
            return
        }
        var command = String(heard[range.upperBound...])
            .trimmingCharacters(in: CharacterSet(charactersIn: " ,.!?"))
        if command.isEmpty { command = "What can you do?" }
        await sendTurn(text: command, image: nil)
    }

    private var talkCard: some View {
        Button {
            if speech.isRecording {
                Task { await finishVoiceTurn() }
            } else {
                speech.startRecording()
            }
        } label: {
            Label(
                speech.isRecording ? "Listening… tap to send" : "Ask Cascade",
                systemImage: speech.isRecording ? "waveform" : "mic.fill"
            )
            .font(.title3.bold())
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
        }
        .buttonStyle(.borderedProminent)
        .tint(speech.isRecording ? .red : .orange)
        .disabled(busy)
    }

    private var settingsCard: some View {
        DisclosureGroup("Settings") {
            TextField("Cascade base URL", text: $baseURL)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            TextField("Your phone (E.164, e.g. +14155551234)", text: $handle)
                .textInputAutocapitalization(.never)
            TextField("Glasses token (optional)", text: $token)
                .textInputAutocapitalization(.never)
        }
        .padding()
        .background(.thinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func finishVoiceTurn() async {
        let text = speech.stopRecording()
        guard !text.isEmpty else {
            reply =
                "Didn't catch any speech — check Settings → Cascade → Microphone & Speech Recognition are allowed, then hold the button while talking."
            return
        }
        await sendTurn(text: text, image: nil)
    }

    private func captureAndSend() async {
        busy = true
        defer { busy = false }
        let image = await glasses.capturePhoto()
        lastCapture = image
        await sendTurn(text: speech.transcript, image: image)
    }

    private func sendTurn(text: String?, image: UIImage?) async {
        let hasText = !(text ?? "").isEmpty
        guard hasText || image != nil else {
            reply =
                "Nothing to send — no speech captured and no photo (camera permission?). Check Settings → Cascade permissions."
            return
        }
        busy = true
        defer { busy = false }
        do {
            let response = try await CascadeAPI.sendTurn(
                baseURL: baseURL.trimmingCharacters(in: .whitespaces),
                token: token.isEmpty ? nil : token,
                handle: handle.trimmingCharacters(in: .whitespaces),
                text: text,
                image: image,
                lat: location.lastCoordinate?.latitude,
                lng: location.lastCoordinate?.longitude
            )
            let spoken = response.reply ?? response.error ?? "No reply."
            reply = spoken
            speech.speak(spoken)
        } catch {
            reply = "Request failed: \(error.localizedDescription)"
        }
    }
}
