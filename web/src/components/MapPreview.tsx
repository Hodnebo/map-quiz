"use client";

import { Box } from "@mui/material";
import { useMemo } from "react";

interface MapPreviewProps {
  featureCount: number;
  color: string;
  height?: number;
}

export function MapPreview({ featureCount, color, height = 120 }: MapPreviewProps) {
  const shapes = useMemo(() => {
    const shapes = [];
    const cols = Math.ceil(Math.sqrt(featureCount));
    const rows = Math.ceil(featureCount / cols);
    const padding = 20;
    const availableWidth = 200 - (padding * 2);
    const availableHeight = height - (padding * 2);
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    for (let i = 0; i < featureCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * cellWidth;
      const y = padding + row * cellHeight;
      
      // Vary the size slightly to make it look more organic
      const width = cellWidth * (0.7 + Math.random() * 0.6);
      const height = cellHeight * (0.7 + Math.random() * 0.6);
      const offsetX = (cellWidth - width) / 2;
      const offsetY = (cellHeight - height) / 2;
      
      shapes.push({
        x: x + offsetX,
        y: y + offsetY,
        width: Math.max(width, 2),
        height: Math.max(height, 2),
        opacity: 0.3 + Math.random() * 0.4, // Vary opacity
      });
    }
    
    return shapes;
  }, [featureCount, height]);

  return (
    <Box
      sx={{
        height,
        position: 'relative',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 200 ${height}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {shapes.map((shape, index) => (
          <rect
            key={index}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill="rgba(255, 255, 255, 0.3)"
            rx={2}
            opacity={shape.opacity}
          />
        ))}
      </svg>
      
      {/* Overlay gradient for depth */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 100%)',
        }}
      />
      
    </Box>
  );
}
