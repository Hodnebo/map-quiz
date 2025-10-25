"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRegionData } from "@/hooks/useRegionData";
import type { GameSettings, GameState } from "@/lib/types";
import { createInitialState, startGame, answer } from "@/lib/game";
import { load, save, hasSeenModal, markModalAsSeen } from "@/lib/persistence";
import { XorShift32 } from "@/lib/rng";
import { playCorrectSound, playWrongSound, initializeAudio } from "@/lib/audio";
import { getEffectiveSettings } from "@/lib/gameModes";
import { gameModeRegistry } from "@/lib/gameModeRegistry";
import { getAssetUrl } from "@/lib/basePath";
import { getMapConfig, hasMapConfig, type MapId } from "@/config/maps";
import { Button, AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import { PlayArrow as PlayArrowIcon, Refresh as RefreshIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Settings as SettingsIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { t } from "@/i18n";
import type { Locale } from "@/i18n/config";
import GameOverlay from "@/components/GameOverlay";
import ReverseQuizOverlay from "@/components/ReverseQuizOverlay";
import { GameModeModal } from "@/components/GameModeModal";

const QuizMap = dynamic(() => import("@/components/Map"), { ssr: false });

const DEFAULT_SETTINGS: GameSettings = {
  gameMode: "classic",
  rounds: 15,
  audioEnabled: true,
  mapStyle: "basic-v2",
};

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const mapId = params.mapId as string;

  if (!hasMapConfig(mapId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Typography variant="h6">Map not found: {mapId}</Typography>
      </div>
    );
  }

  const mapConfig = getMapConfig(mapId);
  const { regions: bydeler, geojson, loading, error } = useRegionData(mapId);
  const { isDarkMode, toggleTheme } = useTheme();
  const [locale, setLocale] = useState<Locale>(() => load(`locale:${mapId}`, "no" as Locale));
  const [settings, setSettings] = useState<GameSettings>(() => load(`settings:${mapId}`, DEFAULT_SETTINGS));
  const [seed, setSeed] = useState<number>(() => load(`seed:${mapId}`, Math.floor(Date.now() % 2 ** 31)));
  const [state, setState] = useState<GameState>(() => createInitialState(settings));
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [wrongAnswerIds, setWrongAnswerIds] = useState<string[]>([]);
  const [lastAnswerExhaustedAttempts, setLastAnswerExhaustedAttempts] = useState<boolean>(false);
  const [lastCorrectAnswerName, setLastCorrectAnswerName] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  const answerLockRef = useRef(false);
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => save(`locale:${mapId}`, locale), [locale, mapId]);
  useEffect(() => save(`settings:${mapId}`, settings), [settings, mapId]);
  useEffect(() => save(`seed:${mapId}`, seed), [seed, mapId]);
  useEffect(() => initializeAudio(), []);

  useEffect(() => {
    if (state.status === 'idle' && !showModal) {
      const hasSeen = hasSeenModal();
      if (!hasSeen) {
        setIsFirstVisit(true);
      }
      setShowModal(true);
    }
  }, []);

  const prevGameModeRef = useRef(settings.gameMode);
  useEffect(() => {
    if (prevGameModeRef.current !== settings.gameMode) {
      const mode = gameModeRegistry.getMode(settings.gameMode);
      const defaultSettings = mode.getDefaultSettings();
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
    const newSeed = Math.floor(Math.random() * 2 ** 31);
    setSeed(newSeed);
    const settingsWithEffective = { ...settings, ...effectiveSettings };
    setState(createInitialState(settingsWithEffective));
    setWrongAnswerIds([]);
    setTimeout(() => {
      setState((s) => startGame(s, allIds, newSeed));
    }, 0);
  }, [allIds, canPlay, settings, effectiveSettings]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    if (isFirstVisit) {
      markModalAsSeen();
      setIsFirstVisit(false);
    }
  }, [isFirstVisit]);

  const handleStartGame = useCallback((mode: string, newSettings: any) => {
    const updatedSettings = {
      ...settings,
      gameMode: mode as any,
      ...newSettings,
    };
    setSettings(updatedSettings);
    setShowModal(false);
    if (isFirstVisit) {
      markModalAsSeen();
      setIsFirstVisit(false);
    }
    setTimeout(() => {
      if (!canPlay) return;
      const settingsWithEffective = { ...updatedSettings, ...getEffectiveSettings(updatedSettings) };
      setState((s) => startGame({ ...s, settings: settingsWithEffective }, allIds, seed));
    }, 0);
  }, [settings, isFirstVisit, canPlay, allIds, seed]);

  const handleNewGame = useCallback(() => {
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (state.status === 'playing' && state.currentTargetId) {
      setFeedbackMessage("");
    }
  }, [state.currentTargetId, state.currentRound]);

  useEffect(() => {
    if (state.status !== 'idle') {
      const settingsWithEffective = { ...settings, ...effectiveSettings };
      setState(prevState => {
        const newState = {
          ...prevState,
          settings: { ...prevState.settings, ...settingsWithEffective }
        };
        if (settingsWithEffective.rounds !== prevState.settings.rounds && state.status === 'playing') {
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
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = null;
      }
      if (stateRef.current.settings.gameMode === 'reverse_quiz') {
        return;
      }
      const res = answer(stateRef.current, id, allIds, seed);
      setFeedback(res.isCorrect ? "correct" : "wrong");
      if (!res.isCorrect) {
        const targetName = bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? "området";
        const guessedName = bydeler?.find((b) => b.id === id)?.name ?? id;
        setFeedbackMessage(`Det var ${guessedName}`);
      } else {
        setFeedbackMessage("");
      }
      if (res.revealedCorrect) {
        setWrongAnswerIds(prev => [...prev, res.correctId!]);
      }
      if (settingsRef.current.audioEnabled ?? true) {
        if (res.isCorrect) {
          playCorrectSound();
        } else {
          playWrongSound();
        }
      }
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
      }
      setState(res.newState);
      answerTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
        if (res.isCorrect) {
          setFeedbackMessage("");
        }
        answerTimeoutRef.current = null;
      }, res.isCorrect ? 450 : 2000);
    },
    [allIds, seed, bydeler, state.currentTargetId]
  );

  const onReverseQuizAnswer = useCallback(
    (userAnswer: string, correctName: string) => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
        answerTimeoutRef.current = null;
      }
      const res = answer(stateRef.current, userAnswer, allIds, seed, correctName);
      setFeedback(res.isCorrect ? "correct" : "wrong");
      setLastAnswerExhaustedAttempts(res.revealedCorrect);
      if (res.revealedCorrect) {
        setLastCorrectAnswerName(correctName);
      }
      setFeedbackMessage("");
      if (res.revealedCorrect) {
        setWrongAnswerIds(prev => [...prev, res.correctId!]);
      }
      if (settingsRef.current.audioEnabled ?? true) {
        if (res.isCorrect) {
          playCorrectSound();
        } else {
          playWrongSound();
        }
      }
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
      }
      setState(res.newState);
      answerTimeoutRef.current = setTimeout(() => {
        if (stateRef.current.settings.gameMode !== 'reverse_quiz') {
          setFeedback(null);
          if (res.isCorrect) {
            setFeedbackMessage("");
          }
        }
        answerTimeoutRef.current = null;
      }, res.isCorrect ? 450 : 2000);
    },
    [allIds, seed]
  );

  const targetName = useMemo(() => bydeler?.find((b) => b.id === state.currentTargetId)?.name ?? null, [bydeler, state.currentTargetId]);
  const attemptsLeft = useMemo(() => {
    return (effectiveSettings.maxAttempts ?? 3) - (state.attemptsThisRound ?? 0);
  }, [effectiveSettings.maxAttempts, state.attemptsThisRound]);

  const mapConfigForComponent = useMemo(() => {
    if (!geojson) return null;
    const mode = gameModeRegistry.getMode(state.settings.gameMode);
    return mode.getMapConfig(state, settings, geojson, seed);
  }, [geojson, state, settings, seed]);

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => router.push('/')}
            color="inherit"
            sx={{
              color: 'white',
              marginRight: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {mapConfig.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {state.status === "idle" ? (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={doStart}
                disabled={!canPlay}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                Start
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={doRestart}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                Restart
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={handleNewGame}
              sx={{
                borderWidth: '2px',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Nytt spill
            </Button>
            <Button
              color="inherit"
              onClick={() => setLocale(locale === 'no' ? 'en' : 'no')}
              sx={{
                color: 'white',
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '0.85rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {locale === 'no' ? 'EN' : 'NO'}
            </Button>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              aria-label="toggle theme"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
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
        {canPlay && mapConfigForComponent && (
          <QuizMap
            geojsonUrl={getAssetUrl(mapConfig.dataPath)}
            onFeatureClick={onFeatureClick}
            highlightFeatureId={settings.gameMode === 'reverse_quiz' ? state.currentTargetId : null}
            disableHoverOutline={mapConfigForComponent.disableHoverOutline}
            focusBounds={mapConfigForComponent.focusBounds}
            focusPadding={mapConfigForComponent.focusPadding}
            revealedIds={state.revealedIds}
            wrongAnswerIds={wrongAnswerIds}
            candidateIds={state.candidateIds}
            isDarkMode={isDarkMode}
            mapStyle={settings.mapStyle}
            center={mapConfig.center}
            initialZoom={mapConfig.initialZoom}
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
          showSettings={false}
          locale={locale}
        />

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

        <GameModeModal
          open={showModal}
          onClose={handleModalClose}
          onStartGame={handleStartGame}
          currentMode={settings.gameMode}
          currentSettings={settings}
          totalEntries={allIds.length}
          locale={locale}
        />
      </div>
    </div>
  );
}
