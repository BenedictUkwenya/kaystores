"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { AddressDetails } from "@/types/order";
import { Input } from "@/components/ui/Input";
import {
  nominatimToAddress,
  parseLocationFromText,
  type NominatimResult,
} from "@/lib/maps/nominatim";

type Props = {
  value: AddressDetails;
  onChange: (next: AddressDetails) => void;
  label?: string;
  hint?: string;
  required?: boolean;
};

const LAGOS = { lat: 6.5244, lng: 3.3792 };

export function AddressLocationPicker({
  value,
  onChange,
  label = "Shipping address",
  hint = "Search, use your location, paste a Maps link, or drop a pin — fields stay editable.",
  required,
}: Props) {
  const searchId = useId();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  const [query, setQuery] = useState("");
  const [paste, setPaste] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [locationSource, setLocationSource] = useState<
    "gps" | "map" | "search" | "link" | null
  >(null);

  function flyMapTo(lat: number, lng: number) {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLatLng([lat, lng]);
    map.flyTo([lat, lng], 16, { duration: 0.8 });
  }

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icons under bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (cancelled || !mapEl.current || mapRef.current) return;

      const start =
        valueRef.current.lat != null && valueRef.current.lng != null
          ? { lat: valueRef.current.lat, lng: valueRef.current.lng }
          : LAGOS;

      const map = L.map(mapEl.current, {
        center: [start.lat, start.lng],
        zoom: valueRef.current.lat != null ? 16 : 11,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([start.lat, start.lng], { draggable: true }).addTo(
        map,
      );

      async function applyCoords(lat: number, lng: number) {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], Math.max(map.getZoom(), 15));
        try {
          const res = await fetch(
            `/api/maps/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
          );
          const data = await res.json();
          if (data.result) {
            const next = nominatimToAddress(
              data.result as NominatimResult,
              valueRef.current,
            );
            onChangeRef.current(next);
            setLocationSource("map");
            return;
          }
        } catch {
          // keep pin even if reverse fails
        }
        onChangeRef.current({
          ...valueRef.current,
          lat,
          lng,
        });
        setLocationSource("map");
      }

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        void applyCoords(e.latlng.lat, e.latlng.lng);
      });

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        void applyCoords(pos.lat, pos.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
      // Leaflet needs a resize after layout
      window.setTimeout(() => map.invalidateSize(), 80);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || value.lat == null || value.lng == null) return;
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const current = marker.getLatLng();
    if (
      Math.abs(current.lat - value.lat) < 1e-5 &&
      Math.abs(current.lng - value.lng) < 1e-5
    ) {
      return;
    }
    marker.setLatLng([value.lat, value.lng]);
    map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
  }, [value.lat, value.lng, mapReady]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const res = await fetch(
          `/api/maps/search?q=${encodeURIComponent(q)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Search failed.");
        setSuggestions((data.results as NominatimResult[]) ?? []);
      } catch (err) {
        setSuggestions([]);
        setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  function patch(partial: Partial<AddressDetails>) {
    onChange({ ...value, ...partial });
  }

  function pickSuggestion(result: NominatimResult) {
    const next = nominatimToAddress(result, value);
    onChange(next);
    setQuery(result.display_name);
    setSuggestions([]);
    setLocationSource("search");
    if (next.lat != null && next.lng != null) {
      flyMapTo(next.lat, next.lng);
    }
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location is not available on this device/browser.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        flyMapTo(lat, lng);
        try {
          const res = await fetch(
            `/api/maps/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
          );
          const data = await res.json();
          if (data.result) {
            const next = nominatimToAddress(
              data.result as NominatimResult,
              valueRef.current,
            );
            onChange(next);
            setQuery(next.formattedAddress || next.line1);
            setLocationSource("gps");
          } else {
            onChange({
              ...valueRef.current,
              lat,
              lng,
              formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            });
            setLocationSource("gps");
          }
        } catch {
          onChange({ ...valueRef.current, lat, lng });
          setLocationSource("gps");
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        const msg =
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission blocked. Allow location for this site, or drop a pin on the map."
            : geoError.code === geoError.TIMEOUT
              ? "Location request timed out. Try again or drop a pin."
              : "Could not get your location. Drop a pin on the map instead.";
        setError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function applyPastedLink() {
    const coords = parseLocationFromText(paste);
    if (!coords) {
      setError("Paste a Google Maps link or coordinates like 6.52, 3.37");
      return;
    }
    setError("");
    flyMapTo(coords.lat, coords.lng);
    try {
      const res = await fetch(
        `/api/maps/reverse?lat=${encodeURIComponent(String(coords.lat))}&lng=${encodeURIComponent(String(coords.lng))}`,
      );
      const data = await res.json();
      if (data.result) {
        const next = nominatimToAddress(
          data.result as NominatimResult,
          value,
        );
        onChange(next);
        setQuery(next.formattedAddress || next.line1);
        setLocationSource("link");
      } else {
        onChange({ ...value, lat: coords.lat, lng: coords.lng });
        setLocationSource("link");
      }
      setPaste("");
    } catch {
      onChange({ ...value, lat: coords.lat, lng: coords.lng });
      setLocationSource("link");
    }
  }

  const pinSaved = value.lat != null && value.lng != null;

  return (
    <div className="sm:col-span-2 space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <label
            htmlFor={searchId}
            className="mb-1.5 block text-[12px] font-medium text-kay-muted"
          >
            Find location
          </label>
          <input
            id={searchId}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search street, estate, landmark…"
            className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[14px] text-kay-fg outline-none transition-colors placeholder:text-kay-subtle focus:border-kay-fg"
            autoComplete="off"
          />
          <p className="mt-1.5 text-[12px] text-kay-subtle">
            {hint}
            {searching ? " Searching…" : ""}
          </p>
          {suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-kay-border bg-kay-surface-elevated shadow-lg">
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="block w-full px-3 py-2.5 text-left text-[13px] text-kay-fg hover:bg-kay-gold-light/40"
                  >
                    {s.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex h-10 items-center rounded-full border border-kay-border px-4 text-[12px] font-medium text-kay-fg hover:border-kay-fg disabled:opacity-60"
          >
            {locating ? "Getting GPS…" : "Use my current location"}
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="Or paste a Google Maps / location link"
            className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[14px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-fg"
          />
          <button
            type="button"
            onClick={applyPastedLink}
            className="h-11 rounded-lg border border-kay-fg px-4 text-[13px] font-medium text-kay-fg hover:bg-kay-fg hover:text-kay-accent-fg"
          >
            Use link
          </button>
        </div>

        {error && <p className="text-[12px] text-red-600">{error}</p>}

        <div
          ref={mapEl}
          className="h-56 w-full overflow-hidden rounded-xl border border-kay-border bg-kay-surface sm:h-64"
          aria-label="Map to choose delivery location"
        />
        {pinSaved ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-[12px] text-emerald-900">
            <p className="font-medium">
              {locationSource === "gps"
                ? "GPS location saved for this checkout"
                : "Delivery pin saved for this checkout"}
            </p>
            <p className="mt-0.5 text-emerald-800/90">
              {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)}
              {value.formattedAddress ? ` · ${value.formattedAddress}` : ""}
            </p>
            <p className="mt-1 text-[11px] text-emerald-800/80">
              You can still edit the address fields below if the street name looks incomplete.
            </p>
          </div>
        ) : (
          <p className="text-[12px] text-kay-muted">
            No pin yet — use GPS, search, paste a link, or tap the map.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          variant="checkout"
          label={label}
          value={value.line1}
          onChange={(e) => patch({ line1: e.target.value })}
          className="sm:col-span-2"
          required={required}
          hint="Editable — add street / estate if GPS only found the area name."
        />
        <Input
          variant="checkout"
          label="City"
          value={value.city}
          onChange={(e) => patch({ city: e.target.value })}
          required={required}
        />
        <Input
          variant="checkout"
          label="Postal Code"
          value={value.postalCode ?? ""}
          onChange={(e) => patch({ postalCode: e.target.value })}
        />
        <Input
          variant="checkout"
          label="State"
          value={value.state}
          onChange={(e) => patch({ state: e.target.value })}
          required={required}
        />
        <Input
          variant="checkout"
          label="Country"
          value={value.country}
          onChange={(e) => patch({ country: e.target.value })}
          required={required}
        />
      </div>
    </div>
  );
}
