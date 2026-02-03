export default function Head() {
    return (
        <>
            {/* Safari pinned tab / mask icon */}
            <link rel="mask-icon" href="/icons/wolf-light.svg" color="#00706d" />
            {/* Apple touch icon fallback */}
            <link rel="apple-touch-icon" href="/icons/wolf-180x180.png" />
            {/* Prefer high-fidelity SVG favicon (modern browsers) */}
            <link rel="icon" href="/icons/wolf-light.svg" type="image/svg+xml" />
            {/* Standard favicons (override Next default) - prefer 32px PNG for tab clarity */}
            <link rel="icon" href="/icons/wolf-32x32.png" sizes="32x32" type="image/png" />
            <link rel="icon" href="/icons/wolf-16x16.png" sizes="16x16" type="image/png" />
            <link rel="icon" href="/icons/wolf-light.ico" />
            {/* Theme color for mobile browsers (light/dark) */}
            <meta name="theme-color" media="(prefers-color-scheme: light)" content="#00b9b3" />
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#19b3ac" />
        </>
    );
}

