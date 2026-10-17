/**
 * Helper to generate official Google Maps directions URL without requiring an API key.
 * Format: https://www.google.com/maps/dir/?api=1&origin=ORIGIN&destination=DESTINATION
 * 
 * Spec:
 * - origin: optional starting coordinates or location. When omitted, Google Maps prompts for user's current location.
 * - destination: required target coordinates or location.
 * - All parameters are URL-encoded.
 * - Does not require a Google Maps API key.
 */
export function getGoogleMapsDirectionsUrl(
  destination: { lat: number; lng: number; name?: string; address?: string },
  origin?: { lat: number; lng: number; address?: string; name?: string } | null
): string {
  const destCoords = `${destination.lat},${destination.lng}`;
  
  if (
    origin &&
    typeof origin.lat === 'number' &&
    typeof origin.lng === 'number' &&
    !isNaN(origin.lat) &&
    !isNaN(origin.lng)
  ) {
    const originCoords = `${origin.lat},${origin.lng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originCoords)}&destination=${encodeURIComponent(destCoords)}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destCoords)}`;
}
