import Foundation
import UIKit

/// Client for the Cascade backend's glasses endpoints.
/// Configure `baseURL`, `handle`, and optional `token` in Settings.
struct CascadeAPI {
    struct TurnResponse: Decodable {
        let ok: Bool?
        let action: String?
        let jobId: String?
        let reply: String?
        let error: String?
    }

    /// Raised when the server answers with something that isn't the turn
    /// JSON — a Vercel auth page, a Next 404/500 page, a proxy error. The
    /// status and body snippet are the diagnosis; JSONDecoder's own message
    /// ("data isn't in the correct format") hides both.
    enum APIError: LocalizedError {
        case nonJSON(status: Int, body: String)

        var errorDescription: String? {
            switch self {
            case let .nonJSON(status, body):
                let snippet = body.isEmpty ? "an empty body" : "“\(body)”"
                return "Server replied \(status) with \(snippet) — check the base URL (and any Vercel protection on the deployment)."
            }
        }
    }

    static func sendTurn(
        baseURL: String,
        token: String?,
        handle: String,
        text: String?,
        image: UIImage?,
        lat: Double? = nil,
        lng: Double? = nil
    ) async throws -> TurnResponse {
        var urlString = "\(baseURL)/api/glasses/turn"
        if let token, !token.isEmpty {
            urlString += "?token=\(token.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? token)"
        }
        guard let url = URL(string: urlString) else {
            throw URLError(.badURL)
        }

        var body: [String: Any] = ["handle": handle]
        if let text, !text.isEmpty { body["text"] = text }
        if let lat, let lng {
            body["lat"] = lat
            body["lng"] = lng
        }
        if let image,
           let jpeg = image.jpegData(compressionQuality: 0.6) {
            body["imageDataUri"] =
                "data:image/jpeg;base64,\(jpeg.base64EncodedString())"
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 60

        let (data, response) = try await URLSession.shared.data(for: request)
        do {
            return try JSONDecoder().decode(TurnResponse.self, from: data)
        } catch {
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let snippet = String(decoding: data.prefix(200), as: UTF8.self)
                .trimmingCharacters(in: .whitespacesAndNewlines)
            throw APIError.nonJSON(status: status, body: snippet)
        }
    }

    /// Fire-and-forget partial transcript so the glasses HUD shows live
    /// captions while the wearer is still speaking.
    static func postTranscript(
        baseURL: String,
        handle: String,
        text: String
    ) async {
        guard let url = URL(string: "\(baseURL)/api/glasses/transcript"),
              !text.isEmpty
        else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONSerialization.data(
            withJSONObject: ["handle": handle, "text": text]
        )
        request.timeoutInterval = 5
        _ = try? await URLSession.shared.data(for: request)
    }
}
