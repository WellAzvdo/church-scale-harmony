// Geolocation utility for check-in validation

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ChurchLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Check if user is within the allowed radius of the church
export function isWithinChurchRadius(
  userCoords: Coordinates,
  churchLocation: ChurchLocation
): boolean {
  const distance = calculateDistance(userCoords, {
    latitude: churchLocation.latitude,
    longitude: churchLocation.longitude,
  });
  return distance <= churchLocation.radiusMeters;
}

// Get current user position using browser's Geolocation API
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada pelo seu navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Permissão de localização negada. Por favor, habilite a localização para fazer check-in.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Localização indisponível. Tente novamente.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Tempo esgotado ao obter localização. Tente novamente.'));
            break;
          default:
            reject(new Error('Erro ao obter localização.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
