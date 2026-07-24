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

    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let synthesizer = AVSpeechSynthesizer()

    func requestPermissions() {
        SFSpeechRecognizer.requestAuthorization { _ in }
        AVAudioApplication.requestRecordPermission { _ in }
    }

    /// Routes audio through the glasses (Bluetooth HFP) when they're paired.
    private func activateSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .voiceChat,
            options: [.allowBluetooth, .allowBluetoothA2DP, .defaultToSpeaker]
        )
        try session.setActive(true)
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
                }
            }
            isRecording = true
        } catch {
            print("startRecording failed: \(error)")
        }
    }

    /// Stops the tap and returns the final transcript.
    func stopRecording() -> String {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        task?.finish()
        isRecording = false
        return transcript
    }

    func speak(_ text: String) {
        try? activateSession()
        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = 0.5
        synthesizer.speak(utterance)
    }
}
