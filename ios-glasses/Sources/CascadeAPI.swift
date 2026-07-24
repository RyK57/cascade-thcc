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

    static func sendTurn(
        baseURL: String,
        token: String?,
        handle: String,
        text: String?,
        image: UIImage?
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

        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(TurnResponse.self, from: data)
    }
}
