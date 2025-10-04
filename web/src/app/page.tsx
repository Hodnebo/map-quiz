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
import { gameModeRegistry } from "@/lib/gameModeRegistry";
import { getAssetUrl } from "@/lib/basePath";
import { Button, AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import { PlayArrow as PlayArrowIcon, Refresh as RefreshIcon, Shuffle as ShuffleIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import GameOverlay from "@/components/GameOverlay";
import ReverseQuizOverlay from "@/components/ReverseQuizOverlay";

const QuizMap = dynamic(() => import("@/components/Map"), { ssr: false });

const DEFAULT_SETTINGS: GameSettings = {
  gameMode: "classic",
  rounds: 15,
  audioEnabled: true,
  mapStyle: "basic-v2",
};


export default function Home() {
  const { bydeler, geojson, loading, error } = useBydelerData();
  const { isDarkMode, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<GameSettings>(() => load("settings", DEFAULT_SETTINGS));
  const [seed, setSeed] = useState<number>(() => load("seed", Math.floor(Date.now() % 2 ** 31)));
  const [state, setState] = useState<GameState>(() => createInitialState(settings));
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [wrongAnswerIds, setWrongAnswerIds] = useState<string[]>([]);
  const [lastAnswerExhaustedAttempts, setLastAnswerExhaustedAttempts] = useState<boolean>(false);
  const [lastCorrectAnswerName, setLastCorrectAnswerName] = useState<string>('');
  const answerLockRef = useRef(false);
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => save("settings", settings), [settings]);
  useEffect(() => save("seed", seed), [seed]);
  useEffect(() => initializeAudio(), []);

  // Update settings with mode defaults when gameMode changes
  const prevGameModeRef = useRef(settings.gameMode);
  useEffect(() => {
    if (prevGameModeRef.current !== settings.gameMode) {
      const mode = gameModeRegistry.getMode(settings.gameMode);
      const defaultSettings = mode.getDefaultSettings();
      
      // Only update if the setting is not already set
      const updatedSettings = { ...settings };
      let hasChanges = false;
      
      Object.entries(defaultSettings).forEach(([key, value]) => {
        if (updatedSettings[key as keyof GameSettings] === undefined && value !== undefined) {
          (updatedSettings as any)[key] = value;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setSettings(updatedSettings);
      }
      
      prevGameModeRef.current = settings.gameMode;
    }
  }, [settings.gameMode, settings]);

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
    setState(createInitialState(settingsWithEffective));
    setWrongAnswerIds([]); // Clear wrong answer highlights
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
      
      // Don't process map clicks in reverse quiz mode
      if (stateRef.current.settings.gameMode === 'reverse_quiz') {
        return;
      }
      
      const res = answer(stateRef.current, id, allIds, seed);
      setFeedback(res.isCorrect ? "correct" : "wrong");

      // Set feedback message for overlay - only for wrong answers
      if (!res.isCorrect) {
        const targetName = bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? "området";
        const guessedName = bydeler?.find((b) => b.id === id)?.name ?? id;
        setFeedbackMessage(`Det var ${guessedName}`);
        // Don't add clicked area to wrongAnswerIds here - only add target area when revealedCorrect
      } else {
        // Clear feedback message immediately on correct answers
        setFeedbackMessage("");
      }

      // Add wrong answer to the list if answer was wrong and revealed
      if (res.revealedCorrect) {
        setWrongAnswerIds(prev => [...prev, res.correctId!]);
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
      }, res.isCorrect ? 450 : 2000); // Longer delay for wrong answers
    },
    [allIds, seed, bydeler, state.currentTargetId]
  );

  const onReverseQuizAnswer = useCallback(
    (userAnswer: string, correctName: string) => {
      if (answerLockRef.current) return;
      const res = answer(stateRef.current, userAnswer, allIds, seed, correctName);
      setFeedback(res.isCorrect ? "correct" : "wrong");
      setLastAnswerExhaustedAttempts(res.revealedCorrect);
      if (res.revealedCorrect) {
        setLastCorrectAnswerName(correctName);
      }

      // Clear feedback message for reverse quiz
      setFeedbackMessage("");

      // Add wrong answer to the list if answer was wrong and revealed
      if (res.revealedCorrect) {
        setWrongAnswerIds(prev => [...prev, res.correctId!]);
      }

      // Play audio feedback if enabled
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
        // For reverse quiz mode, keep feedback until next input
        if (stateRef.current.settings.gameMode !== 'reverse_quiz') {
          setFeedback(null);
          if (res.isCorrect) {
            setFeedbackMessage("");
          }
        }
        answerLockRef.current = false;
      }, res.isCorrect ? 450 : 2000);
    },
    [allIds, seed]
  );

  const targetName = useMemo(() => bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? null, [bydeler, state.currentTargetId]);
  const attemptsLeft = useMemo(() => {
    // For reverse quiz feedback, calculate based on current state
    return (effectiveSettings.maxAttempts ?? 3) - (state.attemptsThisRound ?? 0);
  }, [effectiveSettings.maxAttempts, state.attemptsThisRound]);
  


  const mapConfig = useMemo(() => {
    if (!geojson) return null;
    const mode = gameModeRegistry.getMode(state.settings.gameMode);
    return mode.getMapConfig(state, settings, geojson, seed);
  }, [geojson, state, settings, seed]);


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
        {state.status === "playing" && targetName && settings.gameMode !== 'reverse_quiz' && (
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
              <span className="font-semibold text-white">
                {feedback === "wrong" && attemptsLeft <= 0 ? `Riktig svar: ${targetName}` : targetName}
              </span>
            </span>
            {feedbackMessage && (
              <div className="mt-1 text-xs text-white text-center" style={{ opacity: 0.95 }}>
                {feedbackMessage}
              </div>
            )}
          </div>
        )}
        {canPlay && mapConfig && (
          <QuizMap
            geojsonUrl={getAssetUrl("/data/bydeler_simplified.geo.json")}
            onFeatureClick={onFeatureClick}
            highlightFeatureId={settings.gameMode === 'reverse_quiz' ? state.currentTargetId : null}
            disableHoverOutline={mapConfig.disableHoverOutline}
            focusBounds={mapConfig.focusBounds}
            focusPadding={mapConfig.focusPadding}
            revealedIds={state.revealedIds}
            wrongAnswerIds={wrongAnswerIds}
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

        {/* Reverse Quiz Overlay */}
        {settings.gameMode === 'reverse_quiz' && bydeler && (
          <ReverseQuizOverlay
            state={state}
            settings={settings}
            targetName={targetName}
            targetId={state.currentTargetId}
            attemptsLeft={lastAnswerExhaustedAttempts ? 0 : attemptsLeft}
            lastCorrectAnswerName={lastCorrectAnswerName}
            bydeler={bydeler}
            onAnswer={onReverseQuizAnswer}
            feedback={feedback}
            feedbackMessage={feedbackMessage}
            onClearFeedback={() => {
              setFeedback(null);
              setFeedbackMessage("");
              setLastAnswerExhaustedAttempts(false);
              setLastCorrectAnswerName("");
            }}
          />
        )}
      </div>
    </div>
  );
}
