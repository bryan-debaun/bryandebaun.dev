import { ImageResponse } from 'next/og';

// Default social card for the site. Uses the Norwegian-sea teal / Fjord-blue
// palette to match the site branding (see src/app/globals.css design tokens).
export const runtime = 'edge';

export const alt = 'Bryan DeBaun — Software Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage(): ImageResponse {
    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '80px',
                // Deep Norwegian teal → Fjord blue, matching site brand tokens
                background:
                    'linear-gradient(135deg, #00554f 0%, #00706d 45%, #0f538f 100%)',
                color: '#ffffff',
                fontFamily: 'sans-serif',
            }}
        >
            <div
                style={{
                    fontSize: 96,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.05,
                }}
            >
                Bryan DeBaun
            </div>
            <div
                style={{
                    marginTop: 28,
                    fontSize: 40,
                    fontWeight: 400,
                    color: '#bfeff0',
                }}
            >
                Software Engineer — projects, writing & technical demos
            </div>
            <div
                style={{
                    marginTop: 56,
                    fontSize: 30,
                    fontWeight: 500,
                    color: '#40d7d0',
                }}
            >
                bryandebaun.dev
            </div>
        </div>,
        { ...size },
    );
}
