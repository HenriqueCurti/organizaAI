/**
 * Utilitários para manipulação de URLs do Google Maps e coordenadas GPS.
 * Suporta links diretos, busca por nome, coordenadas puras e deep links para mobile/Waze.
 */

export interface LocationData {
  locationName?: string | null;
  locationUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Retorna a melhor URL para abrir no Google Maps / Waze / Apple Maps
 */
export function getGoogleMapsUrl(data: LocationData): string | null {
  const { locationName, locationUrl, latitude, longitude } = data;

  // 1. Se houver link direto informado
  if (locationUrl && locationUrl.trim().length > 0) {
    const trimmed = locationUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  // 2. Se houver coordenadas GPS válidas
  if (
    typeof latitude === "number" &&
    !isNaN(latitude) &&
    typeof longitude === "number" &&
    !isNaN(longitude)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  // 3. Se houver apenas o nome do local/rancho
  if (locationName && locationName.trim().length > 0) {
    const trimmed = locationName.trim();
    // Se o usuário por engano colou o link no campo de nome
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
  }

  return null;
}

/**
 * Interpreta um texto inserido pelo usuário (link do Maps ou coordenadas)
 * e extrai coordenadas e URL canônica.
 */
export function parseLocationInput(input: string): {
  locationUrl: string;
  latitude: number | null;
  longitude: number | null;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { locationUrl: "", latitude: null, longitude: null };
  }

  // Padrão 1: Coordenadas brutas no formato "lat, lng" ou "lat lng" (ex: "-20.485123, -47.456789")
  const coordsRegex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  if (coordsRegex.test(trimmed)) {
    const parts = trimmed.split(/[,\s]+/).map((p) => parseFloat(p.trim())).filter((n) => !isNaN(n));
    if (parts.length >= 2) {
      const lat = parts[0];
      const lng = parts[1];
      return {
        locationUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        latitude: lat,
        longitude: lng,
      };
    }
  }

  // Padrão 2: URL do Google Maps contendo coordenadas no formato @lat,lng ou q=lat,lng ou query=lat,lng
  const urlCoordsMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    trimmed.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);

  if (urlCoordsMatch) {
    const lat = parseFloat(urlCoordsMatch[1]);
    const lng = parseFloat(urlCoordsMatch[2]);
    return {
      locationUrl: trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      latitude: isNaN(lat) ? null : lat,
      longitude: isNaN(lng) ? null : lng,
    };
  }

  // Padrão 3: Qualquer URL (ex: maps.app.goo.gl encurtada)
  const finalUrl = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  return {
    locationUrl: finalUrl,
    latitude: null,
    longitude: null,
  };
}
