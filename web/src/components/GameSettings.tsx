'use client';

import { Card, CardContent, Typography, Box, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, TextField, FormHelperText } from '@mui/material';
import type { GameSettings } from '@/lib/types';

interface GameSettingsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  allIdsLength: number;
  isGameActive?: boolean;
}

export default function GameSettings({ settings, onSettingsChange, allIdsLength }: GameSettingsProps) {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

          <FormControl size="small" fullWidth disabled={(settings.alternativesCount ?? 0) > 1}>
            <InputLabel>Vanskelighet</InputLabel>
            <Select
              value={settings.difficulty}
              label="Vanskelighet"
              onChange={(e) => updateSetting('difficulty', e.target.value as "training" | "easy" | "normal" | "hard")}
            >
              <MenuItem value="training">Trening</MenuItem>
              <MenuItem value="easy">Lett</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="hard">Vanskelig</MenuItem>
            </Select>
            {(settings.alternativesCount ?? 0) > 1 && (
              <FormHelperText>Deaktivert når alternativer er på</FormHelperText>
            )}
          </FormControl>


          <FormControlLabel
            control={
              <Checkbox
                checked={settings.audioEnabled ?? true}
                onChange={(e) => updateSetting('audioEnabled', e.target.checked)}
              />
            }
            label="Lyd"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Alternativer</InputLabel>
            <Select
              value={String(settings.alternativesCount ?? 0)}
              label="Alternativer"
              onChange={(e) => updateSetting('alternativesCount', Number(e.target.value) || null)}
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
            onChange={(e) => updateSetting('maxAttempts', Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
          />
        </Box>
      </CardContent>
    </Card>
  );
}