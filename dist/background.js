let STATE = {
  score: 0,
  lastUpdate: Date.now()
};

const THRESHOLDS = {
  STRESS_MAX: 12,    
  FOCUS_MIN: 4,      
  TIRED_MAX: -8,    
};

let rawMood = 'RELAXED';
const DECAY_RATE = 0.90; 

// Load persistent state immediately upon Service Worker wake-up
chrome.storage.local.get(['engineState'], (res) => {
  if (res.engineState) {
    STATE = res.engineState;
    rawMood = STATE.rawMood || 'RELAXED';
  }
});

function saveState() {
  STATE.rawMood = rawMood;
  chrome.storage.local.set({ engineState: STATE });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BEHAVIOR_METRICS') {
    console.log('[AwareTab Brain] Received data packet from a tab.');
    processMetrics(message.data);
  }
});

function processMetrics(data) {
  // Normalize each activity so that "frantic" single-action gives a high score
  const mouseScore = data.mouseDistance / 1000;
  const clickScore = data.clickCount / 2;
  const scrollScore = data.scrollDistance / 500;
  const keyScore = data.keypressCount / 5;

  const totalDelta = mouseScore + clickScore + scrollScore + keyScore;
  console.log(`[AwareTab Brain] Calculated single-tick delta: ${totalDelta.toFixed(2)}`);

  // Catch up on missed decay cycles while the Service Worker was asleep/inactive
  const now = Date.now();
  const elapsed = now - STATE.lastUpdate;
  const missedCycles = Math.floor(elapsed / 5000);
  
  if (missedCycles > 0) {
    for (let i = 0; i < missedCycles; i++) {
        STATE.score -= 1.5;
        STATE.score *= DECAY_RATE;
    }
  }

  STATE.score += totalDelta;
  if (totalDelta === 0 && missedCycles === 0) {
    STATE.score -= 1.5; 
  }

  STATE.score *= DECAY_RATE;

  if (STATE.score > 20) STATE.score = 20;
  if (STATE.score < -20) STATE.score = -20;

  evaluateMood();
}

setInterval(() => {
  const now = Date.now();
  if (now - STATE.lastUpdate >= 5000) {
     STATE.score -= 1.5; 
     STATE.score *= DECAY_RATE;
     if (STATE.score < -20) STATE.score = -20;
     evaluateMood();
  }
}, 5000);

function evaluateMood() {
  STATE.lastUpdate = Date.now();

  let determinedMood = 'RELAXED';

  if (STATE.score > THRESHOLDS.STRESS_MAX) {
    determinedMood = 'STRESSED';
  } else if (STATE.score > THRESHOLDS.FOCUS_MIN) {
    determinedMood = 'FOCUSED';
  } else if (STATE.score < THRESHOLDS.TIRED_MAX) {
    determinedMood = 'TIRED';
  } else {
    determinedMood = 'RELAXED';
  }

  if (determinedMood !== rawMood) {
    console.log(`[AwareTab Brain] MOOD CHANGED: ${rawMood} -> ${determinedMood}`);
    rawMood = determinedMood;
    // Broadcast newly computed overarching mood!
    chrome.storage.local.set({ globalRawMood: rawMood });
  } else {
    console.log(`[AwareTab Brain] Evaluated score: ${STATE.score.toFixed(2)}. Mood remains: ${rawMood}`);
  }

  saveState();
}
