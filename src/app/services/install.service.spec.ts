import { installHint } from './install.service';

describe('installHint', () => {
  const ua = {
    iphone:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    ipadAsMac:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    macSafari:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    macChrome:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0',
    windowsEdge:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
    android:
      'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  };

  it('gives the Home Screen steps on iPhone and iPad', () => {
    expect(installHint(ua.iphone, 5)).toBe('ios');
    expect(installHint(ua.ipadAsMac, 5)).toBe('ios');
  });

  it('gives the Dock steps in Safari on a Mac', () => {
    expect(installHint(ua.macSafari, 0)).toBe('mac-safari');
  });

  it('gives no steps where the browser has its own prompt or cannot install', () => {
    expect(installHint(ua.macChrome, 0)).toBeNull();
    expect(installHint(ua.macFirefox, 0)).toBeNull();
    expect(installHint(ua.windowsEdge, 0)).toBeNull();
    expect(installHint(ua.android, 5)).toBeNull();
  });
});
