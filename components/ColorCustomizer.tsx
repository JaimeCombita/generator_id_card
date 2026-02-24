'use client';

import { useState, useEffect } from 'react';

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

      {/* Paletas Predefinidas */}
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
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{
                    background: `linear-gradient(135deg, ${palette.colors.gradientStart} 0%, ${palette.colors.gradientEnd} 100%)`,
                  }}
                />
              </div>
              <p className="text-xs font-semibold text-gray-800 text-center">{palette.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Pickers Personalizados */}
      <div className="border-t-2 border-gray-100 pt-4 sm:pt-6">
        <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3 sm:mb-4">
          Colores Personalizados
        </label>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Gradiente Inicio */}
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

          {/* Gradiente Fin */}
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

          {/* Borde Carnet */}
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

          {/* Línea Header */}
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

          {/* Título */}
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

          {/* Etiquetas */}
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

          {/* Texto Valores */}
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

          {/* Color Acento */}
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

      {/* Vista Previa */}
      <div className="mt-6 p-2 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center">
        <p className="text-xs font-semibold text-gray-700 mb-3 w-full">Vista Previa del Carnet {credentialLevel === 'business' ? '(Empresarial)' : '(Estudiantil)'}</p>
        <div className="w-full px-2 sm:px-0 flex justify-center">
          <div
            className="rounded-lg shadow-lg flex-shrink-0"
            style={{
              width: '100%',
              maxWidth: '350px',
              minWidth: '280px',
              aspectRatio: '380 / 240',
              background: `linear-gradient(135deg, ${customColors.gradientStart} 0%, ${customColors.gradientEnd} 100%)`,
              border: `2px solid ${customColors.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'white',
                height: 'clamp(52px, 16vw, 64px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 clamp(10px, 3vw, 14px)',
                borderBottom: `4px solid ${customColors.headerBorder}`,
                gap: 'clamp(6px, 2vw, 10px)',
              }}
            >
              <div
                style={{
                  width: 'clamp(34px, 11vw, 48px)',
                  height: 'clamp(34px, 11vw, 48px)',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 'clamp(10px, 3vw, 13px)',
                    color: customColors.titleColor,
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {credentialLevel === 'business' ? 'EMPRESA' : 'COLEGIO'}
                </div>
                <div style={{ fontSize: 'clamp(8px, 2.3vw, 10px)', color: '#6b7280', marginTop: '2px' }}>
                  {credentialLevel === 'business' ? 'Carnet Empresarial' : 'Carnet Estudiantil'}
                </div>
              </div>
              <div
                style={{
                  width: 'clamp(34px, 11vw, 48px)',
                  height: 'clamp(34px, 11vw, 48px)',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Contenido */}
            <div
              style={{
                display: 'flex',
                padding: 'clamp(10px, 3.5vw, 16px)',
                gap: 'clamp(8px, 3vw, 16px)',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              {/* Foto */}
              <div
                style={{
                  width: 'clamp(84px, 28vw, 128px)',
                  height: 'clamp(104px, 34vw, 160px)',
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  border: '2px solid white',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(24px, 8vw, 40px)',
                  flexShrink: 0,
                }}
              >
                👤
              </div>

              {/* Información */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 'clamp(4px, 1.5vw, 6px)',
                  overflow: 'hidden',
                  minWidth: 0,
                }}
              >
                {/* Campo Nombre */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: 'clamp(5px, 1.6vw, 9px) clamp(7px, 2.2vw, 12px)',
                    borderRadius: '4px',
                    borderLeft: `2px solid ${customColors.labelColor}`,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(7px, 2vw, 9px)',
                      color: customColors.labelColor,
                      fontWeight: 'bold',
                      letterSpacing: '0.3px',
                      lineHeight: '1',
                    }}
                  >
                    NOMBRE
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(9px, 2.4vw, 11px)',
                      fontWeight: 'bold',
                      color: customColors.textColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.2',
                      marginTop: '1px',
                    }}
                  >
                    Juan Pérez
                  </div>
                </div>

                {/* Campo Curso/Cargo */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: 'clamp(5px, 1.6vw, 9px) clamp(7px, 2.2vw, 12px)',
                    borderRadius: '4px',
                    borderLeft: `2px solid ${customColors.labelColor}`,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(7px, 2vw, 9px)',
                      color: customColors.labelColor,
                      fontWeight: 'bold',
                      letterSpacing: '0.3px',
                      lineHeight: '1',
                    }}
                  >
                    {credentialLevel === 'business' ? 'CARGO' : 'CURSO'}
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(9px, 2.4vw, 11px)',
                      fontWeight: 'bold',
                      color: customColors.textColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.2',
                      marginTop: '1px',
                    }}
                  >
                    {credentialLevel === 'business' ? 'Analista' : '10-A'}
                  </div>
                </div>

                {/* Campo ID */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: 'clamp(5px, 1.6vw, 9px) clamp(7px, 2.2vw, 12px)',
                    borderRadius: '4px',
                    borderLeft: `2px solid ${customColors.labelColor}`,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(7px, 2vw, 9px)',
                      color: customColors.labelColor,
                      fontWeight: 'bold',
                      letterSpacing: '0.3px',
                      lineHeight: '1',
                    }}
                  >
                    ID
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(9px, 2.4vw, 11px)',
                      fontWeight: 'bold',
                      color: customColors.textColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.2',
                      marginTop: '1px',
                    }}
                  >
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
