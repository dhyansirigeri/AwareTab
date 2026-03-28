console.log('[AwareTab] Feature Tracking Active on this page!');

let lastPos = null;
let currentMetrics = {
  mouseDistance: 0,
  clickCount: 0,
  scrollDistance: 0,
  keypressCount: 0,
};

document.addEventListener('mousemove', (e) => {
  if (lastPos) {
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    currentMetrics.mouseDistance += Math.sqrt(dx * dx + dy * dy);
  }
  lastPos = { x: e.clientX, y: e.clientY };
});

document.addEventListener('click', () => {
  currentMetrics.clickCount++;
});

let lastScrollY = window.scrollY;
document.addEventListener('scroll', () => {
  const currentY = window.scrollY;
  currentMetrics.scrollDistance += Math.abs(currentY - lastScrollY);
  lastScrollY = currentY;
});

document.addEventListener('keydown', () => {
  currentMetrics.keypressCount++;
});

// Send metrics to background service worker every 5 seconds
setInterval(() => {
  if (
    currentMetrics.mouseDistance > 0 ||
    currentMetrics.clickCount > 0 ||
    currentMetrics.scrollDistance > 0 ||
    currentMetrics.keypressCount > 0
  ) {
    console.log('[AwareTab] Sending behavior metrics to background:', currentMetrics);
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'BEHAVIOR_METRICS',
          data: currentMetrics
        });
      }
    } catch (e) {
      // Ignore context errors
    }
  }

  // Reset
  currentMetrics = {
    mouseDistance: 0,
    clickCount: 0,
    scrollDistance: 0,
    keypressCount: 0
  };
}, 5000);
