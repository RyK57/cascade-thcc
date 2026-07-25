import CoreLocation
import Foundation

/// Lightweight when-in-use location: last known fix rides along with each
/// Cascade turn so peer broadcasts carry a maps link + proximity sorting.
@MainActor
final class LocationProvider: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var lastCoordinate: CLLocationCoordinate2D?

    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func start() {
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
    }

    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        guard let coordinate = locations.last?.coordinate else { return }
        Task { @MainActor in self.lastCoordinate = coordinate }
    }

    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didFailWithError error: Error
    ) {
        // Location is best-effort; turns go out without it.
    }
}
