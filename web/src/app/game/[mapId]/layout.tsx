import React from 'react';
import { getAllMapIds } from '@/config/maps';

export function generateStaticParams() {
  return getAllMapIds().map((mapId) => ({
    mapId,
  }));
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
