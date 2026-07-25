import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'DocsLite — write it, share it, nothing in the way';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f7f8fa',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          position: 'relative',
        }}
      >
        {/* soft iris wash, top-right */}
        <div
          style={{
            position: 'absolute',
            top: -260,
            right: -180,
            width: 720,
            height: 720,
            borderRadius: 720,
            background: '#f0f0fe',
          }}
        />
        {/* rotated document card bleeding off the right edge */}
        <div
          style={{
            position: 'absolute',
            right: -70,
            top: 150,
            width: 360,
            height: 440,
            background: '#ffffff',
            border: '1px solid #e4e7eb',
            borderRadius: 16,
            transform: 'rotate(8deg)',
            display: 'flex',
            flexDirection: 'column',
            padding: 40,
            gap: 18,
            boxShadow: '0 24px 60px rgba(16,19,26,0.12)',
          }}
        >
          <div style={{ height: 14, width: 150, background: '#e6e6fb', borderRadius: 7 }} />
          <div style={{ height: 10, width: 240, background: '#eef0f3', borderRadius: 5 }} />
          <div style={{ height: 10, width: 210, background: '#eef0f3', borderRadius: 5 }} />
          <div style={{ height: 10, width: 240, background: '#eef0f3', borderRadius: 5 }} />
          <div style={{ height: 10, width: 120, background: '#eef0f3', borderRadius: 5 }} />
        </div>

        {/* lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: '#5b5bd6',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 5,
              padding: '0 11px',
            }}
          >
            <div style={{ height: 3, width: 14, background: '#fff', borderRadius: 2 }} />
            <div style={{ height: 3, width: 22, background: '#fff', borderRadius: 2 }} />
            <div style={{ height: 3, width: 9, background: '#fff', borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: '#10131a' }}>DocsLite</div>
        </div>

        {/* headline block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
          <div style={{ width: 64, height: 4, background: '#5b5bd6', borderRadius: 2 }} />
          <div style={{ fontSize: 62, fontWeight: 600, color: '#10131a', lineHeight: 1.05, letterSpacing: -1 }}>
            Write it. Share it. Nothing in the way.
          </div>
          <div style={{ fontSize: 26, color: '#6e7681' }}>A lightweight collaborative document editor.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
