import AVFoundation
import Foundation
import Speech

/// On-device speech: push-to-talk transcription (SFSpeechRecognizer) and
/// spoken replies (AVSpeechSynthesizer). The audio session prefers Bluetooth
/// HFP so the glasses' mic and speakers are used when connected.
@MainActor
final class SpeechManager: NSObject, ObservableObject {
    @Published var isRecording = false
    @Published var transcript = ""
    @Published var handsFree = false

    /// Fired in hands-free mode when an utterance ends (silence after speech).
    var onUtterance: ((String) -> Void)?

    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let synthesizer = AVSpeechSynthesizer()
    private var lastChangeAt = Date.distantPast
    private var silenceTimer: Timer?

    func requestPermissions() {
        SFSpeechRecognizer.requestAuthorization { _ in }
        AVAudioApplication.requestRecordPermission { _ in }
    }

    /// Routes audio through the glasses when paired: HFP for the mic,
    /// A2DP allowed for playback (per Meta's DAT audio guidance).
    private func activateSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .default,
            options: [.allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
        )
        try session.setActive(true, options: .notifyOthersOnDeactivation)
        if let hfpInput = session.availableInputs?.first(where: {
            $0.portType == .bluetoothHFP
        }) {
            try? session.setPreferredInput(hfpInput)
        }
    }

    func startRecording() {
        guard !isRecording else { return }
        transcript = ""
        do {
            try activateSession()
            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            self.request = request

            let input = audioEngine.inputNode
            let format = input.outputFormat(forBus: 0)
            input.installTap(onBus: 0, bufferSize: 1024, format: format) {
                buffer, _ in
                request.append(buffer)
            }
            audioEngine.prepare()
            try audioEngine.start()

            task = recognizer?.recognitionTask(with: request) {
                [weak self] result, _ in
                guard let self, let result else { return }
                Task { @MainActor in
                    self.transcript = result.bestTranscription.formattedString
                    self.lastChangeAt = Date()
                }
            }
            isRecording = true
        } catch {
            print("startRecording failed: \(error)")
        }
    }

    // MARK: - Hands-free (wake word) mode

    func setHandsFree(_ enabled: Bool) {
        handsFree = enabled
        if enabled {
            startHandsFreeCycle()
        } else {
            silenceTimer?.invalidate()
            silenceTimer = nil
            _ = stopRecording()
        }
    }

    private func startHandsFreeCycle() {
        guard handsFree else { return }
        startRecording()
        lastChangeAt = Date()
        silenceTimer?.invalidate()
        silenceTimer = Timer.scheduledTimer(
            withTimeInterval: 0.5, repeats: true
        ) { [weak self] _ in
            Task { @MainActor in self?.checkSilence() }
        }
    }

    private func checkSilence() {
        guard handsFree, isRecording else { return }
        let quietFor = Date().timeIntervalSince(lastChangeAt)
        // Speech recognizers cap sessions (~1 min): recycle on long idle.
        if transcript.isEmpty {
            if quietFor > 50 { restartHandsFreeListening() }
            return
        }
        if quietFor > 1.8 {
            let heard = stopRecording()
            onUtterance?(heard)
            // Listening resumes after the reply finishes speaking (or now
            // if nothing gets spoken).
            if !synthesizer.isSpeaking {
                restartHandsFreeListening(after: 0.6)
            }
        }
    }

    func restartHandsFreeListening(after delay: TimeInterval = 0) {
        guard handsFree else { return }
        Task { @MainActor in
            if delay > 0 {
                try? await Task.sleep(for: .seconds(delay))
            }
            guard handsFree, !isRecording, !synthesizer.isSpeaking else { return }
            startRecording()
            lastChangeAt = Date()
        }
    }

    /// Stops the tap and returns the final transcript.
    func stopRecording() -> String {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        task?.finish()
        isRecording = false
        if !synthesizer.isSpeaking { deactivateSession() }
        return transcript
    }

    /// Ends HFP so iOS drops the call-style indicator when idle.
    private func deactivateSession() {
        try? AVAudioSession.sharedInstance().setActive(
            false, options: .notifyOthersOnDeactivation
        )
    }

    func speak(_ text: String) {
        try? activateSession()
        synthesizer.delegate = self
        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = 0.5
        synthesizer.speak(utterance)
    }
}

extension SpeechManager: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didFinish utterance: AVSpeechUtterance
    ) {
        Task { @MainActor in
            if self.handsFree {
                // Resume listening once our own voice is done (avoid echo).
                self.restartHandsFreeListening(after: 0.4)
            } else if !self.isRecording {
                self.deactivateSession()
            }
        }
    }
}
