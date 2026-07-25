import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#5b5bd6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 12, width: 62, background: '#fff', borderRadius: 6 }} />
          <div style={{ height: 12, width: 104, background: '#fff', borderRadius: 6 }} />
          <div style={{ height: 12, width: 40, background: '#fff', borderRadius: 6 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
