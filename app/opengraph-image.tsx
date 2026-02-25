import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'JC Engine - Generador de Carnets';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://app-carnets.jcengine.co';

  if (rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://')) {
    return rawSiteUrl;
  }

  return `https://${rawSiteUrl}`;
}

export default function OpenGraphImage() {
  const siteUrl = getSiteUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #312e81 100%)',
          color: 'white',
          padding: '72px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '108px',
              height: '108px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.94)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
            }}
          >
            <img
              src={`${siteUrl}/logo-optimizado.png`}
              alt="Logo JC Engine"
              width="88"
              height="88"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div style={{ fontSize: '52px', fontWeight: 800 }}>JC Engine</div>
        </div>

        <div style={{ fontSize: '66px', fontWeight: 800, lineHeight: 1.1 }}>
          Generador de Carnets
        </div>
        <div
          style={{
            marginTop: '20px',
            fontSize: '34px',
            opacity: 0.95,
            lineHeight: 1.3,
          }}
        >
          Crea credenciales profesionales desde Excel en minutos
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
