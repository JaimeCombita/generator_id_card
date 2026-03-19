'use client';

import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import styles from './ColorCustomizer.module.css';

export interface ColorTheme {
  gradientStart: string;
  gradientEnd: string;
  border: string;
  headerBorder: string;
  titleColor: string;
  labelColor: string;
  textColor: string;
  accentColor: string;
}

export const PREDEFINED_PALETTES = {
  corporate: {
    name: 'Corporativo Azul',
    colors: {
      gradientStart: '#1e3a8a',
      gradientEnd: '#3b82f6',
      border: '#1e40af',
      headerBorder: '#fbbf24',
      titleColor: '#1e40af',
      labelColor: '#fbbf24',
      textColor: '#ffffff',
      accentColor: '#1e3a8a',
    },
  },
  nature: {
    name: 'Verde Natura',
    colors: {
      gradientStart: '#15803d',
      gradientEnd: '#22c55e',
      border: '#166534',
      headerBorder: '#84cc16',
      titleColor: '#166534',
      labelColor: '#84cc16',
      textColor: '#ffffff',
      accentColor: '#15803d',
    },
  },
  energy: {
    name: 'Rojo Energía',
    colors: {
      gradientStart: '#7f1d1d',
      gradientEnd: '#ef4444',
      border: '#991b1b',
      headerBorder: '#fbbf24',
      titleColor: '#991b1b',
      labelColor: '#fbbf24',
      textColor: '#ffffff',
      accentColor: '#7f1d1d',
    },
  },
  elegance: {
    name: 'Púrpura Elegancia',
    colors: {
      gradientStart: '#4c1d95',
      gradientEnd: '#a855f7',
      border: '#6d28d9',
      headerBorder: '#fbbf24',
      titleColor: '#6d28d9',
      labelColor: '#fbbf24',
      textColor: '#ffffff',
      accentColor: '#4c1d95',
    },
  },
  vibrant: {
    name: 'Naranja Dinámico',
    colors: {
      gradientStart: '#92400e',
      gradientEnd: '#fb923c',
      border: '#b45309',
      headerBorder: '#06b6d4',
      titleColor: '#b45309',
      labelColor: '#06b6d4',
      textColor: '#ffffff',
      accentColor: '#92400e',
    },
  },
};

interface ColorCustomizerProps {
  onColorChange: (theme: ColorTheme) => void;
  currentTheme?: ColorTheme;
  credentialLevel?: 'student' | 'business';
}

export default function ColorCustomizer({ onColorChange, currentTheme, credentialLevel = 'student' }: ColorCustomizerProps) {
  const [selectedPalette, setSelectedPalette] = useState<keyof typeof PREDEFINED_PALETTES>('corporate');
  const [customColors, setCustomColors] = useState<ColorTheme>(currentTheme || PREDEFINED_PALETTES.corporate.colors);
  const [useCustom, setUseCustom] = useState(false);

  const previewCardVars = {
    '--gradient-start': customColors.gradientStart,
    '--gradient-end': customColors.gradientEnd,
    '--card-border': customColors.border,
    '--header-border': customColors.headerBorder,
    '--title-color': customColors.titleColor,
    '--label-color': customColors.labelColor,
    '--text-color': customColors.textColor,
  } as CSSProperties;

  const handlePaletteChange = (palette: keyof typeof PREDEFINED_PALETTES) => {
    setSelectedPalette(palette);
    setUseCustom(false);
    const newColors = PREDEFINED_PALETTES[palette].colors;
    setCustomColors(newColors);
    onColorChange(newColors);
  };

  const handleColorChange = (colorKey: keyof ColorTheme, value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    setUseCustom(true);
    onColorChange(newColors);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Personalización de Colores
        </h2>
      </div>

      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
        🎨 Elige una paleta o personaliza los colores del carnet
      </p>

      <div className="mb-6 sm:mb-8">
        <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3">
          Paletas Predefinidas
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 md:gap-3">
          {Object.entries(PREDEFINED_PALETTES).map(([key, palette]) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePaletteChange(key as keyof typeof PREDEFINED_PALETTES)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                selectedPalette === key && !useCustom
                  ? 'border-indigo-600 ring-2 ring-indigo-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={styles.paletteSwatch}
                  style={{
                    '--palette-start': palette.colors.gradientStart,
                    '--palette-end': palette.colors.gradientEnd,
                  } as CSSProperties}
                />
              </div>
              <p className="text-xs font-semibold text-gray-800 text-center">{palette.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-gray-100 pt-4 sm:pt-6">
        <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3 sm:mb-4">
          Colores Personalizados
        </label>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Fondo Inicio</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.gradientStart}
                onChange={(e) => handleColorChange('gradientStart', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.gradientStart}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Fondo Fin</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.gradientEnd}
                onChange={(e) => handleColorChange('gradientEnd', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.gradientEnd}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Borde Carnet</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.border}
                onChange={(e) => handleColorChange('border', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.border}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Línea Header</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.headerBorder}
                onChange={(e) => handleColorChange('headerBorder', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.headerBorder}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Título Institución</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.titleColor}
                onChange={(e) => handleColorChange('titleColor', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.titleColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Etiquetas Campos</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.labelColor}
                onChange={(e) => handleColorChange('labelColor', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.labelColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Texto Valores</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.textColor}
                onChange={(e) => handleColorChange('textColor', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.textColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Color Acento</label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <input
                type="color"
                value={customColors.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="w-10 sm:w-12 h-9 sm:h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-xs text-gray-600 font-mono truncate">{customColors.accentColor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-2 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center">
        <p className="text-xs font-semibold text-gray-700 mb-3 w-full">Vista Previa del Carnet {credentialLevel === 'business' ? '(Empresarial)' : '(Estudiantil)'}</p>
        <div className="w-full px-2 sm:px-0 flex justify-center">
          <div className={styles.previewCard} style={previewCardVars}>
            <div className={styles.previewHeader}>
              <div className={styles.previewLogo} />
              <div className={styles.previewTitleWrap}>
                <div className={styles.previewTitle}>
                  {credentialLevel === 'business' ? 'EMPRESA' : 'COLEGIO'}
                </div>
                <div className={styles.previewSubtitle}>
                  {credentialLevel === 'business' ? 'Carnet Empresarial' : 'Carnet Estudiantil'}
                </div>
              </div>
              <div className={styles.previewLogo} />
            </div>

            <div className={styles.previewBody}>
              <div className={styles.previewPhoto}>
                👤
              </div>

              <div className={styles.previewFields}>
                <div className={styles.previewField}>
                  <div className={styles.previewFieldLabel}>
                    NOMBRE
                  </div>
                  <div className={styles.previewFieldValue}>
                    Juan Pérez
                  </div>
                </div>

                <div className={styles.previewField}>
                  <div className={styles.previewFieldLabel}>
                    {credentialLevel === 'business' ? 'CARGO' : 'CURSO'}
                  </div>
                  <div className={styles.previewFieldValue}>
                    {credentialLevel === 'business' ? 'Analista' : '10-A'}
                  </div>
                </div>

                <div className={styles.previewField}>
                  <div className={styles.previewFieldLabel}>
                    ID
                  </div>
                  <div className={styles.previewFieldValue}>
                    1234567890
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
