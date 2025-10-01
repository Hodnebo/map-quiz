"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useBydelerData } from "@/hooks/useBydelerData";
import type { GameSettings, GameState } from "@/lib/types";
import { createInitialState, startGame, answer } from "@/lib/game";
import { load, save } from "@/lib/persistence";
import { XorShift32 } from "@/lib/rng";
import { playCorrectSound, playWrongSound, initializeAudio } from "@/lib/audio";
import { getEffectiveSettings } from "@/lib/gameModes";
import { getAssetUrl } from "@/lib/basePath";
import { Button, AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import { PlayArrow as PlayArrowIcon, Refresh as RefreshIcon, Shuffle as ShuffleIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import GameOverlay from "@/components/GameOverlay";

const QuizMap = dynamic(() => import("@/components/Map"), { ssr: false });

const DEFAULT_SETTINGS: GameSettings = {
  gameMode: "classic",
  rounds: 15,
  audioEnabled: true,
  mapStyle: "basic-v2",
};

function featureBBox(geojson: unknown, id: string | null): [[number, number], [number, number]] | null {
  if (!geojson || !id) return null;
  const featuresArray = (geojson as { features?: unknown[] })?.features;
  const feat = featuresArray?.find((f: unknown) => {
    const feature = f as { id?: string; properties?: { id?: string } };
    return (feature.id ?? feature.properties?.id) === id;
  });
  if (!feat) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (coords: unknown) => {
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
  const { isDarkMode, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<GameSettings>(() => load("settings", DEFAULT_SETTINGS));
  const [seed, setSeed] = useState<number>(() => load("seed", Math.floor(Date.now() % 2 ** 31)));
  const [state, setState] = useState<GameState>(() => createInitialState(settings, seed));
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const answerLockRef = useRef(false);
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => save("settings", settings), [settings]);
  useEffect(() => save("seed", seed), [seed]);
  useEffect(() => initializeAudio(), []);

  const allIds = useMemo(() => (bydeler ? bydeler.map((b) => b.id) : []), [bydeler]);
  const canPlay = !!geojson && allIds.length > 0;
  const effectiveSettings = useMemo(() => getEffectiveSettings(settings), [settings]);

  const doStart = useCallback(() => {
    if (!canPlay) return;
    const settingsWithEffective = { ...settings, ...effectiveSettings };
    setState((s) => startGame({ ...s, settings: settingsWithEffective }, allIds, seed));
  }, [allIds, canPlay, seed, settings, effectiveSettings]);

  const doRestart = useCallback(() => {
    if (!canPlay) return;
    const settingsWithEffective = { ...settings, ...effectiveSettings };
    setState(createInitialState(settingsWithEffective, seed));
    setTimeout(() => {
      setState((s) => startGame(s, allIds, seed));
    }, 0);
  }, [allIds, canPlay, seed, settings, effectiveSettings]);

  // Clear feedback message when moving to next question
  useEffect(() => {
    if (state.status === 'playing' && state.currentTargetId) {
      setFeedbackMessage("");
    }
  }, [state.currentTargetId, state.currentRound]);

  // Update game state settings dynamically when settings change
  useEffect(() => {
    if (state.status !== 'idle') {
      const settingsWithEffective = { ...settings, ...effectiveSettings };
      setState(prevState => {
        const newState = {
          ...prevState,
          settings: { ...prevState.settings, ...settingsWithEffective }
        };

        // If rounds changed and we're still playing, adjust if needed
        if (settingsWithEffective.rounds !== prevState.settings.rounds && state.status === 'playing') {
          // If new rounds is less than current round, end the game
          if (settingsWithEffective.rounds < prevState.currentRound) {
            newState.status = 'ended';
            newState.currentTargetId = null;
          }
        }

        return newState;
      });
    }
  }, [settings, effectiveSettings, state.status, state.currentRound]);

  const onFeatureClick = useCallback(
    (id: string) => {
      if (answerLockRef.current) return;
      const res = answer(stateRef.current, id, allIds, seed);
      setFeedback(res.isCorrect ? "correct" : "wrong");

      // Set feedback message for overlay - only for wrong answers
      if (!res.isCorrect) {
        const targetName = bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? "området";
        const guessedName = bydeler?.find((b) => b.id === id)?.name ?? id;
        setFeedbackMessage(`Det var ${guessedName}`);
      } else {
        // Clear feedback message immediately on correct answers
        setFeedbackMessage("");
      }

      // Play audio feedback if enabled - use ref to get latest settings
      if (settingsRef.current.audioEnabled ?? true) {
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
        // Only clear feedback message for correct answers
        if (res.isCorrect) {
          setFeedbackMessage("");
        }
        answerLockRef.current = false;
      }, 450);
    },
    [allIds, seed, bydeler, state.currentTargetId]
  );

  const targetName = useMemo(() => bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? null, [bydeler, state.currentTargetId]);
  const attemptsLeft = useMemo(() => (effectiveSettings.maxAttempts ?? 3) - (state.attemptsThisRound ?? 0), [effectiveSettings.maxAttempts, state.attemptsThisRound]);


  const focusBounds = useMemo(() => {
    if (!geojson) return null;
    if (!effectiveSettings.zoomEnabled) return null; // don't zoom if disabled by mode
    if ((effectiveSettings.alternativesCount ?? 0) > 1) return null; // don't zoom when showing alternatives
    const raw = featureBBox(geojson, state.currentTargetId);
    if (!raw) return null;

    const rng = new XorShift32((seed + state.currentRound * 1337) >>> 0);
    const jx = (rng.next() - 0.5) * 2; // Increased range from -1 to 1
    const jy = (rng.next() - 0.5) * 2;

    if (effectiveSettings.difficulty === "training") {
      const padded = padBounds(raw, 1.8, 0.02, 0.015); // Slightly more padding
      return shiftBounds(padded, jx * 0.3, jy * 0.3); // Increased shift
    }
    if (effectiveSettings.difficulty === "easy") {
      const padded = padBounds(raw, 2.5, 0.03, 0.02);
      return shiftBounds(padded, jx * 0.6, jy * 0.6); // Much more shift
    }
    if (effectiveSettings.difficulty === "normal") {
      const padded = padBounds(raw, 3.5, 0.05, 0.035);
      return shiftBounds(padded, jx * 0.8, jy * 0.8); // Even more shift
    }
    if (effectiveSettings.difficulty === "hard") {
      return null; // No zoom at all - show full map
    }
    return null;
  }, [geojson, effectiveSettings.zoomEnabled, effectiveSettings.alternativesCount, effectiveSettings.difficulty, state.currentTargetId, state.currentRound, seed]);

  const focusPadding = useMemo(() => {
    switch (effectiveSettings.difficulty) {
      case "training":
        return 28;
      case "easy":
        return 32;
      case "normal":
        return 40;
      default:
        return 24;
    }
  }, [effectiveSettings.difficulty]);


  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
            Oslo Bydel-Quiz
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {state.status === "idle" ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={doStart}
                disabled={!canPlay}
              >
                Start
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={doRestart}
              >
                Restart
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={() => {
                setSeed(Math.floor(Math.random() * 2 ** 31));
                if (state.status !== "idle") {
                  setTimeout(() => doRestart(), 0);
                }
              }}
              sx={{
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                },
              }}
            >
              Ny seed
            </Button>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              aria-label="toggle theme"
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <div className="relative h-full">
        {loading && <div className="absolute inset-0 flex items-center justify-center">Laster kart...</div>}
        {error && <div className="absolute inset-0 flex items-center justify-center text-red-600">{error}</div>}
        {state.status === "playing" && targetName && (
          <div
            className={
              "pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full shadow-md border " +
              (feedback === "correct"
                 ? " feedback-correct"
                 : feedback === "wrong" || feedbackMessage
                   ? " feedback-wrong"
                   : " bg-blue-600 border-blue-700 text-white")
            }
            aria-live="polite"
          >
            <span className={(feedback === "correct" ? "animate-correct " : feedback === "wrong" ? "animate-wrong " : "") + "inline-flex items-center gap-2"}>
              <span className="text-xs text-white" style={{ opacity: feedback ? 0.9 : 0.9 }}>
                {feedback ? (feedback === "correct" ? "Riktig" : "Feil") : feedbackMessage ? "" : "Finn"}
              </span>
              <span className="font-semibold text-white">{targetName}</span>
            </span>
            {feedbackMessage && (
              <div className="mt-1 text-xs text-white text-center" style={{ opacity: 0.95 }}>
                {feedbackMessage}
              </div>
            )}
          </div>
        )}
        {canPlay && (
          <QuizMap
            geojsonUrl={getAssetUrl("/data/bydeler_simplified.geo.json")}
            onFeatureClick={onFeatureClick}
            highlightFeatureId={null}
            disableHoverOutline={effectiveSettings.difficulty === "hard"}
            focusBounds={focusBounds}
            focusPadding={focusPadding}
            revealedIds={state.revealedIds}
            candidateIds={state.candidateIds}
            isDarkMode={isDarkMode}
            mapStyle={settings.mapStyle}
          />
        )}

        <GameOverlay
          state={state}
          settings={settings}
          effectiveSettings={effectiveSettings}
          onSettingsChange={setSettings}
          allIdsLength={allIds.length}
          targetName={targetName}
          attemptsLeft={attemptsLeft}
        />
      </div>

    </div>
  );
}
