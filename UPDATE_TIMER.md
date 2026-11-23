# AniRead Episode & Dub Update Timer Engine (UPDATE_TIMER.md)

## Purpose
The Update Timer engine provides real-time, second-by-second countdown clocks for upcoming Japanese anime simulcasts and localized dubbed episodes (Hindi, English, Bengali, Tamil, Telugu, and Spanish).

---

## 1. Timing Logic & Cadence Offsets

```
Japanese Simulcast (Day 0) ──► English SimulDub (Day +12) ──► Hindi SimulDub (Day +14)
                                         │                                │
                                  Crunchyroll US               Crunchyroll India
```

1. **Japanese Original Simulcast**:
   - Pulled from AniList GraphQL `airingSchedule` / Jikan broadcast time.
   - Live countdown: `Days : Hours : Minutes : Seconds`.

2. **Crunchyroll India Hindi SimulDub**:
   - Cadence: Drops weekly, typically with a **14-day offset** after the Japanese domestic broadcast.
   - Time: Saturdays at 17:00 / 23:00 IST (Indian Standard Time).
   - Timezone: `IST = UTC + 5:30`.

3. **Crunchyroll English SimulDub**:
   - Cadence: Drops with a **12- to 14-day offset**.
   - Time: Saturdays / Sundays at 15:00 EDT / 19:00 UTC.

4. **Bengali Schedule (Muse India YouTube)**:
   - Cadence: Drops on YouTube with prime-time broadcast at 20:00 IST / 20:30 BST.
   - Timezone: `BST = UTC + 6:00`.

---

## 2. Real-Time Tick Engine

Implemented via React `useEffect` with a 1-second interval:
```ts
const [nowSec, setNowSec] = useState<number>(Math.floor(Date.now() / 1000));
useEffect(() => {
  const timer = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
  return () => clearInterval(timer);
}, []);
```

---

## 3. Supported Timers in AniRead

* **Overview Banner**: Shows next Japanese episode clock and quick status for Hindi & English dubs.
* **Dub Details Panel**: Accessible by clicking any poster badge (`JP`, `HI`, `EN`, `BN`, `TA`, `TE`).
* **All Episode Timers Tab**: Full multi-track grid with days/hours/minutes/seconds and customizable target episode calculator.
* **Dub Release Calendar**: Full weekly timetable separating official announcements from estimated schedules with direct source links.
