"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useBydelerData } from "@/hooks/useBydelerData";
import type { GameSettings, GameState } from "@/lib/types";
import { createInitialState, startGame, answer } from "@/lib/game";
import { load, save } from "@/lib/persistence";
import { XorShift32 } from "@/lib/rng";
import { playCorrectSound, playWrongSound, initializeAudio } from "@/lib/audio";
import { Button, AppBar, Toolbar, Typography, Card, CardContent, Grid, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, TextField, Snackbar, Alert } from "@mui/material";
import { PlayArrow as PlayArrowIcon, Refresh as RefreshIcon, Shuffle as ShuffleIcon } from "@mui/icons-material";

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
      <AppBar position="static" elevation={1} className="col-span-full">
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
            focusBounds={focusBounds}
            focusPadding={focusPadding}
            revealedIds={state.revealedIds}
            candidateIds={state.candidateIds}
          />
        )}
      </div>
      <aside className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4">
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Runde
                </Typography>
                <Typography variant="h2">
                  {state.currentRound}/{settings.rounds}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Poeng
                </Typography>
                <Typography variant="h2">
                  {state.score}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Streak
                </Typography>
                <Typography variant="h2">
                  {state.streak}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Finn område
                </Typography>
                <Typography variant="h2" sx={{ minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {state.status === "playing" ? targetName : state.status === "ended" ? "Ferdig!" : "Trykk Start"}
                </Typography>
                {state.status === "playing" && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Forsøk igjen: {attemptsLeft} igjen
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {!!(state.revealedIds?.length) && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Riktige svar:
              </Typography>
              <Box sx={{ maxHeight: 144, overflow: 'auto' }}>
                {state.revealedIds!.map((id) => (
                  <Typography key={id} variant="body2" sx={{ py: 0.5 }}>
                    • {revealedNames.get(id) ?? id}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Innstillinger
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Runder</InputLabel>
                <Select
                  value={settings.rounds === allIds.length ? "full" : String(settings.rounds)}
                  label="Runder"
                  onChange={(e) => {
                    const v = e.target.value;
                    setSettings((s) => ({
                      ...s,
                      rounds: v === "full" ? allIds.length : Math.max(5, Math.min(100, Number(v) || 0)),
                    }));
                  }}
                >
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="15">15</MenuItem>
                  <MenuItem value="20">20</MenuItem>
                  <MenuItem value="30">30</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                  <MenuItem value="full">Full ({allIds.length-1})</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Vanskelighet</InputLabel>
                <Select
                  value={settings.difficulty}
                  label="Vanskelighet"
                  onChange={(e) => setSettings((s) => ({ ...s, difficulty: e.target.value as "training" | "easy" | "normal" | "hard" }))}
                >
                  <MenuItem value="training">Trening</MenuItem>
                  <MenuItem value="easy">Lett</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="hard">Vanskelig</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.hintsEnabled}
                    onChange={(e) => setSettings((s) => ({ ...s, hintsEnabled: e.target.checked }))}
                  />
                }
                label="Hint"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.audioEnabled ?? true}
                    onChange={(e) => setSettings((s) => ({ ...s, audioEnabled: e.target.checked }))}
                  />
                }
                label="Lyd"
              />

              <FormControl size="small" fullWidth>
                <InputLabel>Alternativer</InputLabel>
                <Select
                  value={String(settings.alternativesCount ?? 0)}
                  label="Alternativer"
                  onChange={(e) => setSettings((s) => ({ ...s, alternativesCount: Number(e.target.value) || null }))}
                >
                  <MenuItem value="0">Av</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="4">4</MenuItem>
                  <MenuItem value="5">5</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Maks forsøk"
                type="number"
                size="small"
                inputProps={{ min: 1, max: 6 }}
                value={settings.maxAttempts ?? 3}
                onChange={(e) => setSettings((s) => ({ ...s, maxAttempts: Math.max(1, Math.min(6, Number(e.target.value) || 1)) }))}
              />
            </Box>
          </CardContent>
        </Card>
      </aside>

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
