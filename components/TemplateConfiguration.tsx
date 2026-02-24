'use client';

import { useEffect, useState } from 'react';
import ColorCustomizer, { ColorTheme, PREDEFINED_PALETTES } from './ColorCustomizer';

export interface TemplateConfig {
  credentialLevel: 'student' | 'business';
  schoolName: string;
  includeSEDLogo: boolean;
  alternativeCityHallLogo: File | null;
  schoolLogo: File | null;
  colorTheme: ColorTheme;
}

interface TemplateConfigurationProps {
  useDefaultTemplate: boolean;
  onConfigChange: (config: TemplateConfig) => void;
  showCredentialSelector?: boolean;
  stepNumber?: number;
  credentialLevelOverride?: 'student' | 'business';
}

export default function TemplateConfiguration({ 
  useDefaultTemplate, 
  onConfigChange,
  showCredentialSelector = true,
  stepNumber = 3,
  credentialLevelOverride,
}: TemplateConfigurationProps) {
  const [credentialLevel, setCredentialLevel] = useState<'student' | 'business'>('student');
  const [schoolName, setSchoolName] = useState('Colegio Estrella del Sur');
  const [includeSEDLogo, setIncludeSEDLogo] = useState(true);
  const [alternativeCityHallLogo, setAlternativeCityHallLogo] = useState<File | null>(null);
  const [alternativeLogoPreview, setAlternativeLogoPreview] = useState<string>('');
  const [schoolLogo, setSchoolLogo] = useState<File | null>(null);
  const [schoolLogoPreview, setSchoolLogoPreview] = useState<string>('');
  const [colorTheme, setColorTheme] = useState<ColorTheme>(PREDEFINED_PALETTES.corporate.colors);

  useEffect(() => {
    if (!credentialLevelOverride || credentialLevelOverride === credentialLevel) {
      return;
    }

    setCredentialLevel(credentialLevelOverride);

    if (credentialLevelOverride === 'business') {
      setIncludeSEDLogo(false);
      setAlternativeCityHallLogo(null);
      setAlternativeLogoPreview('');
      updateConfig({
        credentialLevel: 'business',
        includeSEDLogo: false,
        alternativeCityHallLogo: null,
      });
      return;
    }

    updateConfig({ credentialLevel: 'student' });
  }, [credentialLevelOverride]);

  const handleSchoolNameChange = (name: string) => {
    setSchoolName(name);
    updateConfig({ schoolName: name });
  };

  const handleCredentialLevelChange = (level: 'student' | 'business') => {
    setCredentialLevel(level);

    if (level === 'business') {
      setIncludeSEDLogo(false);
      setAlternativeCityHallLogo(null);
      setAlternativeLogoPreview('');
      updateConfig({
        credentialLevel: level,
        includeSEDLogo: false,
        alternativeCityHallLogo: null,
      });
      return;
    }

    updateConfig({ credentialLevel: level });
  };

  const handleSEDLogoChange = (include: boolean) => {
    setIncludeSEDLogo(include);
    if (include) {
      setAlternativeCityHallLogo(null);
      setAlternativeLogoPreview('');
    }
    updateConfig({ includeSEDLogo: include, alternativeCityHallLogo: include ? null : alternativeCityHallLogo });
  };

  const handleAlternativeLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAlternativeCityHallLogo(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAlternativeLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAlternativeLogoPreview('');
    }
    
    updateConfig({ alternativeCityHallLogo: file });
  };

  const handleSchoolLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSchoolLogo(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSchoolLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSchoolLogoPreview('');
    }
    
    updateConfig({ schoolLogo: file });
  };

  const updateConfig = (updates: Partial<TemplateConfig>) => {
    onConfigChange({
      credentialLevel,
      schoolName,
      includeSEDLogo,
      alternativeCityHallLogo,
      schoolLogo,
      colorTheme,
      ...updates,
    });
  };

  if (!useDefaultTemplate) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {stepNumber}. Configuración de la Plantilla
        </h2>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
        ✨ Personaliza los detalles de tu carnet
      </p>

      <div className="space-y-4 sm:space-y-6">
        {showCredentialSelector && (
        <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3">
            Tipo de carnet
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer transition-colors" style={{ borderColor: credentialLevel === 'student' ? '#6366f1' : '#e5e7eb' }}>
              <input
                type="radio"
                name="credentialLevel"
                checked={credentialLevel === 'student'}
                onChange={() => handleCredentialLevelChange('student')}
                className="mr-2 w-4 h-4 text-indigo-600"
              />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">Estudiantil</span>
            </label>
            <label className="flex items-center p-3 bg-white rounded-lg border-2 cursor-pointer transition-colors" style={{ borderColor: credentialLevel === 'business' ? '#6366f1' : '#e5e7eb' }}>
              <input
                type="radio"
                name="credentialLevel"
                checked={credentialLevel === 'business'}
                onChange={() => handleCredentialLevelChange('business')}
                className="mr-2 w-4 h-4 text-indigo-600"
              />
              <span className="text-xs sm:text-sm font-semibold text-gray-800">Empresarial</span>
            </label>
          </div>
        </div>
        )}

        {/* Nombre del colegio */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {credentialLevel === 'student' ? 'Nombre del Colegio' : 'Nombre de la Empresa'}
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => handleSchoolNameChange(e.target.value)}
            placeholder={credentialLevel === 'student' ? 'Ej: Colegio Estrella del Sur' : 'Ej: Empresa ABC S.A.S'}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
          />
        </div>

        {/* Logo de la Secretaría de Educación */}
        {credentialLevel === 'student' && (
        <div className="border-t-2 border-gray-100 pt-4 sm:pt-6">
          <label className="flex items-center cursor-pointer mb-3 p-2 sm:p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
            <input
              type="checkbox"
              checked={includeSEDLogo}
              onChange={(e) => handleSEDLogoChange(e.target.checked)}
              className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 focus:ring-2 cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-purple-700">
                Incluir logo de la Secretaría de Educación de Bogotá
              </span>
            </div>
          </label>

          {/* Logo alternativo de alcaldía */}
          {!includeSEDLogo && (
            <div className="ml-3 sm:ml-6 mt-3 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Logo alternativo de alcaldía (opcional)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleAlternativeLogoChange}
                  className="hidden"
                  id="alternative-logo-upload"
                />
                <label
                  htmlFor="alternative-logo-upload"
                  className="cursor-pointer px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Seleccionar logo
                </label>
                {alternativeCityHallLogo && (
                  <span className="text-xs sm:text-sm text-gray-600 font-medium break-all">{alternativeCityHallLogo.name}</span>
                )}
              </div>
              {alternativeLogoPreview && (
                <div className="mt-3 p-2 bg-white rounded-lg shadow-sm border border-amber-200">
                  <img 
                    src={alternativeLogoPreview} 
                    alt="Logo alternativo" 
                    className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Logo del colegio */}
        <div className="border-t-2 border-gray-100 pt-4 sm:pt-6">
          <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {credentialLevel === 'student' ? 'Logo del Colegio' : 'Logo de la Institución'}
            </label>
            <p className="text-xs text-gray-600 mb-3 bg-white/60 px-2 sm:px-3 py-2 rounded-lg">
              💡 {credentialLevel === 'student' ? 'Sube el logo de tu colegio. Si no subes ninguno, se usará el logo por defecto de la plantilla.' : 'Sube el logo de la institución. Si no subes ninguno, se usará el logo por defecto de la plantilla.'}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleSchoolLogoChange}
                className="hidden"
                id="school-logo-upload"
              />
              <label
                htmlFor="school-logo-upload"
                className="cursor-pointer px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                {schoolLogo ? 'Cambiar logo' : 'Seleccionar logo'}
              </label>
              {schoolLogo && (
                <span className="text-xs sm:text-sm text-gray-600 font-medium break-all">{schoolLogo.name}</span>
              )}
            </div>
            {schoolLogoPreview && (
              <div className="mt-3 flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-green-200">
                <img 
                  src={schoolLogoPreview} 
                  alt={credentialLevel === 'student' ? 'Logo del colegio' : 'Logo de la institución'} 
                  className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                />
                <button
                  onClick={() => {
                    setSchoolLogo(null);
                    setSchoolLogoPreview('');
                    updateConfig({ schoolLogo: null });
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 sm:px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Color Customizer */}
        <div className="border-t-2 border-gray-100 pt-4 sm:pt-6">
          <ColorCustomizer
            currentTheme={colorTheme}
            credentialLevel={credentialLevel}
            onColorChange={(theme) => {
              setColorTheme(theme);
              updateConfig({ colorTheme: theme });
            }}
          />
        </div>
      </div>
    </div>
  );
}
