import splashVideo from '@/assets/videos/splash.mp4';

const CSS = `
  .ss-root {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    display: grid;
    place-items: center;
    z-index: 1400;
    background: #fff;
    overflow: hidden;
    animation: ss-fadeIn 0.24s ease-out both;
  }

  .ss-video,
  .ss-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .ss-video {
    display: block;
    background: transparent;
    object-position: center center;
    transform: translateZ(0);
    pointer-events: none;
  }

  .ss-video-bg {
    object-fit: cover;
    filter: blur(18px) saturate(0.88) brightness(1.2);
    transform: scale(1.08) translateZ(0);
    opacity: 0.18;
  }

  .ss-video-main {
    z-index: 2;
    background: #fff;
    object-fit: contain;
  }

  .ss-overlay {
    z-index: 1;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%),
      radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 62%);
    pointer-events: none;
  }

  @keyframes ss-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

if (!document.getElementById('ss-styles')) {
  const style = document.createElement('style');
  style.id = 'ss-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}

type StartupSplashProps = {
  onComplete: () => void;
};

export function StartupSplash({ onComplete }: StartupSplashProps) {
  return (
    <div className="ss-root" role="status" aria-live="polite" aria-label="Loading MatchMySize">
      <video
        className="ss-video ss-video-bg"
        src={splashVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <video
        className="ss-video ss-video-main"
        src={splashVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={onComplete}
        onError={onComplete}
      />
      <div className="ss-overlay" aria-hidden="true" />
    </div>
  );
}

export default StartupSplash;
