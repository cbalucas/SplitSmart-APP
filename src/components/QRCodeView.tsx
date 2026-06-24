import React, { useMemo } from 'react';
import { View } from 'react-native';
import qrcode from 'qrcode-generator';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export default function QRCodeView({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
}: QRCodeViewProps) {
  const modules = useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(value);
      qr.make();
      const count = qr.getModuleCount();
      const grid: boolean[][] = [];
      for (let r = 0; r < count; r++) {
        grid[r] = [];
        for (let c = 0; c < count; c++) {
          grid[r][c] = qr.isDark(r, c);
        }
      }
      return { grid, count };
    } catch {
      return null;
    }
  }, [value]);

  if (!modules) return null;

  const { grid, count } = modules;
  const cellSize = size / count;

  return (
    <View style={{ width: size, height: size, backgroundColor }}>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((dark, c) => (
            <View
              key={c}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: dark ? color : backgroundColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
