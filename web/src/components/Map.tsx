"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map as MlMap, LngLatLike, LngLatBoundsLike, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapProps {
  geojsonUrl: string;
  onFeatureClick?: (featureId: string) => void;
  highlightFeatureId?: string | null;
  showRedHighlight?: boolean;
  disableHoverOutline?: boolean;
  focusBounds?: LngLatBoundsLike | null;
  focusPadding?: number;
  revealedIds?: string[];
  wrongAnswerIds?: string[];
  hideBasemapLabels?: boolean;
  candidateIds?: string[];
  isDarkMode?: boolean;
  mapStyle?: "backdrop" | "dataviz" | "basic-v2";
  center?: LngLatLike;
  initialZoom?: number;
}

export default function MapView(props: MapProps) {
  const {
    geojsonUrl,
    onFeatureClick,
    highlightFeatureId,
    showRedHighlight = false,
    isDarkMode,
    disableHoverOutline,
    focusBounds,
    focusPadding = 24,
    revealedIds = [],
    wrongAnswerIds = [],
    hideBasemapLabels = true,
    candidateIds = [],
    mapStyle = "basic-v2",
    center = [10.7522, 59.9139] as LngLatLike, // Default to Oslo
    initialZoom = 10,
  } = (props ?? ({} as MapProps));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const hasFitRef = useRef(false);
  const dataRef = useRef<any | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const sourceId = useMemo(() => "bydeler-source", []);
  const fillLayerId = useMemo(() => "bydeler-fill", []);
  const lineLayerId = useMemo(() => "bydeler-line", []);
  const hoverLineLayerId = useMemo(() => "bydeler-hover-line", []);
  const correctFillId = useMemo(() => "correct-fill", []);
  const wrongFillId = useMemo(() => "wrong-fill", []);
  const candidatesFillId = useMemo(() => "candidates-fill", []);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || !geojsonUrl) return;

    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    // Determine MapTiler style URL based on mapStyle prop and theme
    let vectorStyleUrl: string | undefined;
    if (maptilerKey) {
      // For basic-v2, use base style for light mode (more colorful) and dark variant for dark mode
      let styleUrl: string;
      if (mapStyle === "basic-v2") {
        styleUrl = isDarkMode ? `${mapStyle}-dark` : mapStyle;
      } else {
        // For other styles, use light/dark variants
        const variant = isDarkMode ? "-dark" : "-light";
        styleUrl = `${mapStyle}${variant}`;
      }
      vectorStyleUrl = `https://api.maptiler.com/maps/${styleUrl}/style.json?key=${maptilerKey}`;
    }

    const tileUrl = isDarkMode
      ? "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
      : "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png";

    const fallbackRasterStyle: StyleSpecification = {
      version: 8,
      sources: {
        carto: {
          type: "raster",
          tiles: [tileUrl],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors, © CARTO",
        },
      },
      layers: [
        { id: "carto", type: "raster", source: "carto" },
      ],
    } as any;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: (vectorStyleUrl ?? fallbackRasterStyle) as any,
      center: center,
      zoom: initialZoom,
      interactive: true,
      cooperativeGestures: true,
    });

    mapRef.current = map;

    map.on("load", async () => {
      // Hide labels from basemap (symbol layers)
      if (vectorStyleUrl && hideBasemapLabels) {
        try {
          const layers = map.getStyle().layers ?? [];
          for (const lyr of layers) {
            // @ts-ignore
            if (lyr.type === "symbol") {
              map.setLayoutProperty(lyr.id, "visibility", "none");
            }
          }
        } catch {}
      }

      // Source
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojsonUrl,
          promoteId: "id",
          generateId: true,
        });
      }

      // Layers
      if (!map.getLayer(fillLayerId)) {
        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": [
              "case",
              ["==", ["id"], highlightFeatureId ?? ""],
              showRedHighlight ? "#ef4444" : "#34d399", // Red when exhausted, green otherwise
              "#60a5fa",
            ],
            "fill-opacity": 0.3,
          },
        });
      }

      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#1f2937",
            "line-width": 1.5,
          },
        });
      }

      if (!map.getLayer(hoverLineLayerId)) {
        map.addLayer({
          id: hoverLineLayerId,
          type: "line",
          source: sourceId,
          filter: ["==", ["id"], ""],
          paint: {
            "line-color": "#10b981",
            "line-width": 3,
          },
          layout: {
            visibility: disableHoverOutline ? "none" : "visible",
          },
        });

        let hoveredId: string | number | null = null;
        map.on("mousemove", fillLayerId, (e) => {
          const f = e.features?.[0];
          const id = f?.id as string | number | undefined;
          if (id != null && hoveredId !== id) {
            hoveredId = id;
            map.setFilter(hoverLineLayerId, ["==", ["id"], id]);
            map.getCanvas().style.cursor = "pointer";
          }
        });
        map.on("mouseleave", fillLayerId, () => {
          hoveredId = null;
          map.setFilter(hoverLineLayerId, ["==", ["id"], ""]);
          map.getCanvas().style.cursor = "";
        });
      }

      // Correct fill layer (opaque green under lines)
      if (!map.getLayer(correctFillId)) {
        const listStr: string[] = (revealedIds ?? []).map((x) => String(x));
        const wrongStr: string[] = (wrongAnswerIds ?? []).map((x) => String(x));
        const initialFilter: any = listStr.length > 0
          ? [
              "all",
              ["in", ["get", "id"], ["literal", listStr]],
              ["!", ["in", ["get", "id"], ["literal", wrongStr]]]
            ]
          : ["==", ["get", "id"], "__none__"];
        map.addLayer({
          id: correctFillId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#10b981",
            "fill-opacity": 0.55,
          },
          filter: initialFilter,
        }, lineLayerId);
      }

      // Wrong fill layer (opaque red under lines)
      if (!map.getLayer(wrongFillId)) {
        const listStr: string[] = (wrongAnswerIds ?? []).map((x) => String(x));
        const initialFilter: any = listStr.length > 0
          ? ["in", ["get", "id"], ["literal", listStr]]
          : ["==", ["get", "id"], "__none__"];
        map.addLayer({
          id: wrongFillId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#ef4444",
            "fill-opacity": 0.55,
          },
          filter: initialFilter,
        }, correctFillId);
      }

      // Candidates fill layer (yellow, very light)
      if (!map.getLayer(candidatesFillId)) {
        const listStr: string[] = (candidateIds ?? []).map((x) => String(x));
        const initialFilter: any = listStr.length > 0
          ? ["in", ["get", "id"], ["literal", listStr]]
          : ["==", ["get", "id"], "__none__"];
        map.addLayer({
          id: candidatesFillId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#f59e0b",
            "fill-opacity": 0.25,
          },
          filter: initialFilter,
        }, correctFillId);
      }

      // Store data for centroid-based HTML labels
      try {
        const response = await fetch(geojsonUrl);
        dataRef.current = await response.json();
      } catch {}

      // Click handler (bind after layers exist)
      map.on("click", fillLayerId, (e) => {
        const f = e.features?.[0];
        const id = (f?.properties?.id ?? f?.id) as string | number | undefined;
        if (id != null && onFeatureClick) onFeatureClick(String(id));
      });

      // Initial fit
      if (!hasFitRef.current) {
        try {
          const response = await fetch(geojsonUrl);
          const gj = await response.json();
          const bbox = turfBBox(gj);
          if (bbox) {
            map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]] as LngLatBoundsLike, { padding: 20, duration: 0 });
            hasFitRef.current = true;
          }
        } catch {}
      }
    });

    return () => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojsonUrl, hideBasemapLabels, mapStyle, isDarkMode]);

  // Update revealed filters when list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const listStr: string[] = (revealedIds ?? []).map((x) => String(x));
    const wrongStr: string[] = (wrongAnswerIds ?? []).map((x) => String(x));
    const filter: any = listStr.length > 0
      ? [
          "all",
          ["in", ["get", "id"], ["literal", listStr]],
          ["!", ["in", ["get", "id"], ["literal", wrongStr]]]
        ]
      : ["==", ["get", "id"], "__none__"];
    if (map.getLayer(correctFillId)) {
      map.setFilter(correctFillId, filter);
    }

    // Rebuild HTML markers for labels
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];
    const data = dataRef.current;
    if (!data || !Array.isArray(data.features)) return;
    const featureById = new Map<string, any>();
    for (const f of data.features) {
      const k = String(f.id ?? f.properties?.id);
      featureById.set(k, f);
    }
    for (const id of listStr) {
      const f = featureById.get(id);
      if (!f) continue;
      const name = String(f.properties?.name ?? id);
      const centroid = f.properties?.centroid as [number, number] | undefined;
      if (!centroid || !Array.isArray(centroid)) continue;
      const el = document.createElement("div");
      // Use red background for wrong answers, green for correct ones
      const isWrongAnswer = wrongAnswerIds.includes(id);
      el.style.background = isWrongAnswer ? "#ef4444" : "#10b981";
      el.style.color = "white";
      el.style.padding = "2px 6px";
      el.style.borderRadius = "4px";
      el.style.fontSize = "12px";
      el.style.boxShadow = "0 1px 2px rgba(0,0,0,0.2)";
      el.textContent = name;
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(centroid as any)
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [revealedIds, wrongAnswerIds, correctFillId]);

  // Update wrong fill filters when list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const listStr: string[] = (wrongAnswerIds ?? []).map((x) => String(x));
    const filter: any = listStr.length > 0
      ? ["in", ["get", "id"], ["literal", listStr]]
      : ["==", ["get", "id"], "__none__"];
    if (map.getLayer(wrongFillId)) {
      map.setFilter(wrongFillId, filter);
    }
  }, [wrongAnswerIds, wrongFillId]);

  // Update candidates filters when list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const listStr: string[] = (candidateIds ?? []).map((x) => String(x));
    const filter: any = listStr.length > 0
      ? ["in", ["get", "id"], ["literal", listStr]]
      : ["==", ["get", "id"], "__none__"];
    if (map.getLayer(candidatesFillId)) {
      map.setFilter(candidatesFillId, filter);
    }
  }, [candidateIds, candidatesFillId]);

  // Toggle hover outline visibility when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer(hoverLineLayerId)) {
      map.setLayoutProperty(hoverLineLayerId, "visibility", disableHoverOutline ? "none" : "visible");
    }
  }, [disableHoverOutline, hoverLineLayerId]);

  // Update highlight color when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer(fillLayerId)) {
      map.setPaintProperty(fillLayerId, "fill-color", [
        "case",
        ["==", ["id"], highlightFeatureId ?? ""],
        showRedHighlight ? "#ef4444" : "#34d399", // Red when exhausted, green otherwise
        "#60a5fa",
      ]);
    }
  }, [highlightFeatureId, showRedHighlight, fillLayerId]);

  // Focus to provided bounds when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusBounds) return;
    
    try {
      // Validate bounds coordinates
      const [[swLng, swLat], [neLng, neLat]] = focusBounds;
      if (
        swLng >= -180 && swLng <= 180 && swLat >= -90 && swLat <= 90 &&
        neLng >= -180 && neLng <= 180 && neLat >= -90 && neLat <= 90
      ) {
        map.fitBounds(focusBounds, { padding: focusPadding, duration: 300 });
      } else {
        console.warn('Invalid bounds coordinates:', focusBounds);
      }
    } catch (error) {
      console.warn('Error fitting bounds:', error);
    }
  }, [focusBounds, focusPadding]);


  return (
    <div 
      ref={containerRef} 
      className="w-full h-full" 
      style={{ touchAction: 'pan-x pan-y' }}
      aria-label="Kart over Oslo bydeler" 
      role="region" 
    />
  );
}

function turfBBox(geojson: any): [number, number, number, number] | null {
  try {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const walk = (coords: any) => {
      if (typeof coords[0] === "number") {
        const [x, y] = coords as [number, number];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else {
        for (const c of coords) walk(c);
      }
    };
    for (const f of geojson.features ?? []) walk(f.geometry.coordinates);
    if (minX === Infinity) return null;
    return [minX, minY, maxX, maxY];
  } catch {
    return null;
  }
} 