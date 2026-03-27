# Background Assets

Place your video `.mp4`, `.gif`, or `.jpg` background files here.

The system chooses a background automatically based on rules you define in `config.json`.
Instead of forcing a strict naming convention, you can map your custom filenames exactly to the states you want.

**Available conditions to match in your `config.json`:**
1. **"time":** `morning`, `afternoon`, `evening`, `night`
2. **"weather":** `Clear`, `Cloudy`, `Rain`, `Snow`
3. **"mood":** `RELAXED`, `FOCUSED`, `STRESSED`, `TIRED`

**Example `config.json` rule:**
```json
[
  { "time": "night", "weather": "Rain", "file": "Rain Night.mp4" },
  { "weather": "Clear", "mood": "RELAXED", "file": "sunny weather.gif" },
  { "file": "default.jpg" } 
]
```

The system evaluates properties top-down and picks the **first match**. If a specific file is not found or matches, the app will gracefully fall back to a CSS-based gradient background.
