# Pennant Chase

A text-based baseball team sim / incremental game built with React. Found a club in your chosen city, draft a roster, and climb from Little League to the Majors. Every batted ball is a physics dice roll: spray angle, launch, distance, field geometry, defender reaction.

## Running the game

```
npm install   # first time only
npm run dev   # then open the URL it prints (usually http://localhost:5173)
```

## Project structure

```
index.html            The web page that hosts the game
src/
  main.jsx            Entry point — mounts the app on the page
  App.jsx             Main component: all game state and game-flow logic
  game/               Pure game logic (no UI)
    constants.js      Data tables: colors, cities, leagues, traits, stats
    utils.js          Small helpers (number formatting, dice rolls)
    generators.js     Creates players, rosters, and opponent teams
    atBat.js          The batted-ball physics engine
  ui/                 Screens and visual pieces
    styles.js         Shared style objects and fonts
    Icons.jsx         SVG icons
    CitySelect.jsx    Opening screen — pick your city
    Rulebook.jsx      The help overlay
    BallparkTab.jsx   Scoreboard, play-by-play, park info
    RosterTab.jsx     Lineup and player training
    FrontOfficeTab.jsx Revenue streams and club summary
```
