"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useBydelerData } from "@/hooks/useBydelerData";
import type { GameSettings, GameState } from "@/lib/types";
import { createInitialState, startGame, answer } from "@/lib/game";
import { load, save } from "@/lib/persistence";
import { XorShift32 } from "@/lib/rng";
import { playCorrectSound, playWrongSound, initializeAudio } from "@/lib/audio";

const QuizMap = dynamic(() => import("@/components/Map"), { ssr: false });

const DEFAULT_SETTINGS: GameSettings = {
  rounds: 15,
  timerSeconds: null,
  difficulty: "normal",
  hintsEnabled: true,
  maxAttempts: 3,
  audioEnabled: true,
};

function featureBBox(geojson: any, id: string | null): [[number, number], [number, number]] | null {
  if (!geojson || !id) return null;
  const feat = geojson.features?.find((f: any) => (f.id ?? f.properties?.id) === id);
  if (!feat) return null;
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
  walk(feat.geometry.coordinates);
  if (minX === Infinity) return null;
  return [[minX, minY], [maxX, maxY]];
}

function padBounds(bbox: [[number, number], [number, number]], factor: number, minW: number, minH: number): [[number, number], [number, number]] {
  const [[minX, minY], [maxX, maxY]] = bbox;
  const width = Math.max(maxX - minX, minW);
  const height = Math.max(maxY - minY, minH);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const halfW = (width * factor) / 2;
  const halfH = (height * factor) / 2;
  return [[cx - halfW, cy - halfH], [cx + halfW, cy + halfH]];
}

function shiftBounds(bbox: [[number, number], [number, number]], fracX: number, fracY: number): [[number, number], [number, number]] {
  const [[minX, minY], [maxX, maxY]] = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  const cx = (minX + maxX) / 2 + width * fracX;
  const cy = (minY + maxY) / 2 + height * fracY;
  const halfW = width / 2;
  const halfH = height / 2;
  return [[cx - halfW, cy - halfH], [cx + halfW, cy + halfH]];
}

export default function Home() {
  const { bydeler, geojson, loading, error } = useBydelerData();
  const [settings, setSettings] = useState<GameSettings>(() => load("settings", DEFAULT_SETTINGS));
  const [seed, setSeed] = useState<number>(() => load("seed", Math.floor(Date.now() % 2 ** 31)));
  const [state, setState] = useState<GameState>(() => createInitialState(settings, seed));
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const answerLockRef = useRef(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => save("settings", settings), [settings]);
  useEffect(() => save("seed", seed), [seed]);
  useEffect(() => initializeAudio(), []);

  const allIds = useMemo(() => (bydeler ? bydeler.map((b) => b.id) : []), [bydeler]);
  const canPlay = !!geojson && allIds.length > 0;

  const doStart = useCallback(() => {
    if (!canPlay) return;
    setState((s) => startGame({ ...s, settings }, allIds, seed));
  }, [allIds, canPlay, seed, settings]);

  const onFeatureClick = useCallback(
    (id: string) => {
      if (answerLockRef.current) return;
      const res = answer(stateRef.current, id, allIds, seed);
      setFeedback(res.isCorrect ? "correct" : "wrong");

      // Play audio feedback if enabled
      if (settings.audioEnabled ?? true) {
        if (res.isCorrect) {
          playCorrectSound();
        } else {
          playWrongSound();
        }
      }

      answerLockRef.current = true;
      setTimeout(() => {
        setState(res.newState);
        setFeedback(null);
        answerLockRef.current = false;
      }, 450);
    },
    [allIds, seed]
  );

  const targetName = useMemo(() => bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? null, [bydeler, state.currentTargetId]);
  const attemptsLeft = useMemo(() => (settings.maxAttempts ?? 3) - (state.attemptsThisRound ?? 0), [settings.maxAttempts, state.attemptsThisRound]);

  const focusBounds = useMemo(() => {
    if (!geojson) return null;
    if ((settings.alternativesCount ?? 0) > 1) return null; // don't zoom when showing alternatives
    const raw = featureBBox(geojson, state.currentTargetId);
    if (!raw) return null;

    const rng = new XorShift32((seed + state.currentRound * 1337) >>> 0);
    const jx = (rng.next() - 0.5) * 0.5;
    const jy = (rng.next() - 0.5) * 0.5;

    if (settings.difficulty === "training") {
      const padded = padBounds(raw, 1.2, 0.02, 0.015);
      return shiftBounds(padded, jx * 0.2, jy * 0.2);
    }
    if (settings.difficulty === "easy") {
      const padded = padBounds(raw, 1.6, 0.03, 0.02);
      return shiftBounds(padded, jx * 0.3, jy * 0.3);
    }
    if (settings.difficulty === "normal") {
      const padded = padBounds(raw, 2.2, 0.05, 0.035);
      return shiftBounds(padded, jx * 0.4, jy * 0.4);
    }
    return null;
  }, [geojson, settings.alternativesCount, settings.difficulty, state.currentTargetId, state.currentRound, seed]);

  const focusPadding = useMemo(() => {
    switch (settings.difficulty) {
      case "training":
        return 28;
      case "easy":
        return 32;
      case "normal":
        return 40;
      default:
        return 24;
    }
  }, [settings.difficulty]);

  const revealedNames = useMemo(() => {
    const m = new globalThis.Map<string, string>();
    for (const f of geojson?.features ?? []) {
      const k = String(f.id ?? f.properties?.id);
      const v = String(f.properties?.name ?? "");
      m.set(k, v);
    }
    return m;
  }, [geojson]);

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] grid-cols-1 md:grid-cols-[2fr_1fr]">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 col-span-full">
        <h1 className="text-lg font-semibold">Oslo Bydel-Quiz</h1>
        <div className="flex gap-2 items-center">
          <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={doStart} disabled={!canPlay || state.status === "playing"}>Start</button>
          <button className="px-3 py-2 rounded border" onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}>Ny seed</button>
          <button className="px-3 py-2 rounded border" onClick={() => location.reload()}>Reset</button>
        </div>
      </header>
      <div className="relative h-[60vh] md:h-auto">
        {loading && <div className="absolute inset-0 flex items-center justify-center">Laster kart...</div>}
        {error && <div className="absolute inset-0 flex items-center justify-center text-red-600">{error}</div>}
        {state.status === "playing" && targetName && (
          <div
            className={
              "pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-10 backdrop-blur px-4 py-2 rounded-full shadow-md border " +
              (feedback === "correct"
                 ? " feedback-correct"
                 : feedback === "wrong"
                   ? " feedback-wrong"
                   : " bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-800")
            }
            aria-live="polite"
          >
            <span className={(feedback === "correct" ? "animate-correct " : feedback === "wrong" ? "animate-wrong " : "") + "inline-flex items-center gap-2"}>
              <span className="text-xs text-gray-100" style={{ opacity: feedback ? 0.9 : 1 }}>{feedback ? (feedback === "correct" ? "Riktig" : "Feil") : "Finn"}</span>
              <span className="font-semibold">{targetName}</span>
            </span>
          </div>
        )}
        {canPlay && (
          <QuizMap
            geojsonUrl="/data/bydeler_simplified.geo.json"
            onFeatureClick={onFeatureClick}
            highlightFeatureId={null}
            disableHoverOutline={settings.difficulty === "hard"}
            focusBounds={focusBounds as any}
            focusPadding={focusPadding}
            revealedIds={state.revealedIds}
            candidateIds={state.candidateIds}
          />
        )}
      </div>
      <aside className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Runde</div>
            <div className="text-xl font-semibold">{state.currentRound}/{settings.rounds}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Poeng</div>
            <div className="text-xl font-semibold">{state.score}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Streak</div>
            <div className="text-xl font-semibold">{state.streak}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Finn område</div>
            <div className="text-2xl font-bold h-10">{state.status === "playing" ? targetName : state.status === "ended" ? "Ferdig!" : "Trykk Start"}</div>
            {state.status === "playing" && (
              <div className="text-xs text-gray-500 mt-1">Forsøk igjen: {attemptsLeft} igjen</div>
            )}
          </div>
        </div>
        {!!(state.revealedIds?.length) && (
          <div className="text-sm">
            <div className="font-semibold mb-1">Riktige svar:</div>
            <ul className="list-disc pl-5 space-y-1 max-h-36 overflow-auto">
              {state.revealedIds!.map((id) => (
                <li key={id}>{revealedNames.get(id) ?? id}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-2">
          <div className="text-sm font-semibold mb-2">Innstillinger</div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm w-28">Runder</label>
            <select
              className="border rounded px-2 py-1 w-32"
              value={settings.rounds === allIds.length ? "full" : String(settings.rounds)}
              onChange={(e) => {
                const v = e.target.value;
                setSettings((s) => ({
                  ...s,
                  rounds: v === "full" ? allIds.length : Math.max(5, Math.min(100, Number(v) || 0)),
                }));
              }}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="full">Full ({allIds.length-1})</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm w-28">Vanskelighet</label>
            <select className="border rounded px-2 py-1" value={settings.difficulty} onChange={(e) => setSettings((s) => ({ ...s, difficulty: e.target.value as any }))}>
              <option value="training">Trening</option>
              <option value="easy">Lett</option>
              <option value="normal">Normal</option>
              <option value="hard">Vanskelig</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm w-28">Hint</label>
            <input type="checkbox" checked={settings.hintsEnabled} onChange={(e) => setSettings((s) => ({ ...s, hintsEnabled: e.target.checked }))} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm w-28">Lyd</label>
            <input type="checkbox" checked={settings.audioEnabled ?? true} onChange={(e) => setSettings((s) => ({ ...s, audioEnabled: e.target.checked }))} />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm w-28">Alternativer</label>
            <select
              className="border rounded px-2 py-1 w-32"
              value={String(settings.alternativesCount ?? 0)}
              onChange={(e) => setSettings((s) => ({ ...s, alternativesCount: Number(e.target.value) || null }))}
            >
              <option value="0">Av</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm w-28">Maks forsøk</label>
            <input type="number" min={1} max={6} className="border rounded px-2 py-1 w-24" value={settings.maxAttempts ?? 3}
              onChange={(e) => setSettings((s) => ({ ...s, maxAttempts: Math.max(1, Math.min(6, Number(e.target.value) || 1)) }))} />
          </div>
        </div>
      </aside>
    </div>
  );
}
