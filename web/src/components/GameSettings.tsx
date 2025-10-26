'use client';

import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, TextField, FormHelperText, Divider } from '@mui/material';
import type { GameSettings } from '@/lib/types';
import { GAME_MODES, getGameMode, getEffectiveSettings } from '@/lib/gameModes';
import { gameModeRegistry } from '@/lib/gameModeRegistry';

interface GameSettingsProps {
  settings: GameSettings;
  effectiveSettings: ReturnType<typeof getEffectiveSettings>;
  onSettingsChange: (settings: GameSettings) => void;
  allIdsLength: number;
  isGameActive?: boolean;
}

export default function GameSettings({ settings, effectiveSettings, onSettingsChange, allIdsLength }: GameSettingsProps) {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const currentMode = getGameMode(settings.gameMode);
  const modeStrategy = gameModeRegistry.getMode(settings.gameMode);
  const settingsProps = modeStrategy.getSettingsProps();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Game Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
            Spillinnstillinger
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Game Mode Selection */}
            <FormControl size="small" fullWidth>
              <InputLabel>Spillmodus</InputLabel>
              <Select
                value={settings.gameMode}
                label="Spillmodus"
                onChange={(e) => updateSetting('gameMode', e.target.value)}
              >
                {Object.values(GAME_MODES).map((mode) => (
                  <MenuItem key={mode.id} value={mode.id}>
                    {mode.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{currentMode.description}</FormHelperText>
            </FormControl>

            {/* Rounds */}
            <FormControl size="small" fullWidth>
              <InputLabel>Runder</InputLabel>
              <Select
                value={settings.rounds === allIdsLength - 1 ? "full" : String(settings.rounds)}
                label="Runder"
                onChange={(e) => {
                  const v = e.target.value;
                  updateSetting('rounds', v === "full" ? allIdsLength - 1 : Math.max(5, Math.min(100, Number(v) || 0)));
                }}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="15">15</MenuItem>
                <MenuItem value="20">20</MenuItem>
                <MenuItem value="30">30</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="full">Full ({allIdsLength-1})</MenuItem>
              </Select>
            </FormControl>

            {/* Mode-specific settings */}
            {settingsProps.showDifficulty && (
              <FormControl size="small" fullWidth>
                <InputLabel>Vanskelighet</InputLabel>
                <Select
                  value={settings.difficulty ?? currentMode.settings.difficulty}
                  label="Vanskelighet"
                  onChange={(e) => updateSetting('difficulty', e.target.value as "training" | "easy" | "normal" | "hard" | "expert")}
                >
                  <MenuItem value="training">Trening</MenuItem>
                  <MenuItem value="easy">Lett</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="hard">Vanskelig</MenuItem>
                  <MenuItem value="expert">Ekspert</MenuItem>
                </Select>
              </FormControl>
            )}

            {settingsProps.showAlternatives && (
              <FormControl size="small" fullWidth>
                <InputLabel>Alternativer</InputLabel>
                <Select
                  value={String(settings.alternativesCount ?? currentMode.settings.alternativesCount ?? 0)}
                  label="Alternativer"
                  onChange={(e) => updateSetting('alternativesCount', Number(e.target.value) || null)}
                >
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                  <MenuItem value="4">4</MenuItem>
                  <MenuItem value="5">5</MenuItem>
                </Select>
              </FormControl>
            )}

            {settingsProps.showMaxAttempts && (
              <TextField
                label="Maks forsøk"
                type="number"
                size="small"
                inputProps={{ min: 1, max: 6 }}
                value={settings.maxAttempts ?? currentMode.settings.maxAttempts ?? 3}
                onChange={(e) => updateSetting('maxAttempts', Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
              />
            )}

            {settingsProps.showTimer && (
              <TextField
                label="Tidsbegrensning (sekunder)"
                type="number"
                size="small"
                inputProps={{ min: 5, max: 300 }}
                value={settings.timerSeconds ?? currentMode.settings.timerSeconds ?? null}
                onChange={(e) => updateSetting('timerSeconds', Number(e.target.value) || null)}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Audio Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
            Lydinnstillinger
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.audioEnabled ?? true}
                onChange={(e) => updateSetting('audioEnabled', e.target.checked)}
              />
            }
            label="Aktiver lyd ved riktige og gale svar"
          />
        </CardContent>
      </Card>

      {/* Map Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
            Kartinnstillinger
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Kartstil</InputLabel>
            <Select
              value={settings.mapStyle ?? "basic-v2"}
              label="Kartstil"
              onChange={(e) => updateSetting('mapStyle', e.target.value as "backdrop" | "dataviz" | "basic-v2")}
            >
              <MenuItem value="basic-v2">Basic</MenuItem>
              <MenuItem value="backdrop">Backdrop</MenuItem>
              <MenuItem value="dataviz">Dataviz</MenuItem>
            </Select>
            <FormHelperText>Velg kartstil (tilpasser seg automatisk til lys/mørk tema)</FormHelperText>
          </FormControl>
        </CardContent>
      </Card>
    </Box>
  );
}