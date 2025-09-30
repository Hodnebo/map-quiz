"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useBydelerData } from "@/hooks/useBydelerData";
import type { GameSettings, GameState } from "@/lib/types";
import { createInitialState, startGame, answer } from "@/lib/game";
import { load, save } from "@/lib/persistence";
import { XorShift32 } from "@/lib/rng";
import { playCorrectSound, playWrongSound, initializeAudio } from "@/lib/audio";
import { Button, AppBar, Toolbar, Typography, Snackbar, Alert, Box } from "@mui/material";
import { PlayArrow as PlayArrowIcon, Refresh as RefreshIcon, Shuffle as ShuffleIcon } from "@mui/icons-material";
import GameOverlay from "@/components/GameOverlay";

const QuizMap = dynamic(() => import("@/components/Map"), { ssr: false });

const DEFAULT_SETTINGS: GameSettings = {
  rounds: 15,
  timerSeconds: null,
  difficulty: "normal",
  hintsEnabled: true,
  maxAttempts: 3,
  audioEnabled: true,
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
  const [settings, setSettings] = useState<GameSettings>(() => load("settings", DEFAULT_SETTINGS));
  const [seed, setSeed] = useState<number>(() => load("seed", Math.floor(Date.now() % 2 ** 31)));
  const [state, setState] = useState<GameState>(() => createInitialState(settings, seed));
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
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

      // Show snackbar notification
      const targetName = bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? "området";
      if (res.isCorrect) {
        setSnackbarMessage(`Riktig! Du fant ${targetName}! 🎉`);
        setSnackbarSeverity("success");
      } else {
        const guessedName = bydeler?.find((b) => b.id === id)?.name ?? id;
        setSnackbarMessage(`Feil! Det var ${guessedName}, ikke ${targetName}`);
        setSnackbarSeverity("error");
      }
      setSnackbarOpen(true);

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
    [allIds, seed, bydeler, state.currentTargetId, settings.audioEnabled]
  );

  const targetName = useMemo(() => bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? null, [bydeler, state.currentTargetId]);
  const attemptsLeft = useMemo(() => (settings.maxAttempts ?? 3) - (state.attemptsThisRound ?? 0), [settings.maxAttempts, state.attemptsThisRound]);

  const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  }, []);

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


  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h1" component="h1" sx={{ flexGrow: 1 }}>
            Oslo Bydel-Quiz
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={doStart}
              disabled={!canPlay || state.status === "playing"}
            >
              Start
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={() => setSeed(Math.floor(Math.random() * 2 ** 31))}
            >
              Ny seed
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => location.reload()}
            >
              Reset
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <div className="relative h-full">
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
            focusBounds={focusBounds}
            focusPadding={focusPadding}
            revealedIds={state.revealedIds}
            candidateIds={state.candidateIds}
          />
        )}

        <GameOverlay
          state={state}
          settings={settings}
          onSettingsChange={setSettings}
          allIdsLength={allIds.length}
          targetName={targetName}
          attemptsLeft={attemptsLeft}
        />
      </div>

      {/* Snackbar for feedback notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
