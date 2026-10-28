## 🐍 <u>**Snake Game Project by Saroj Dhital**</u>🐍

This is a visually enhanced **2D Snake Game** built using **pure HTML, CSS, and JavaScript**, with **separate local leaderboards for every difficulty** using `localStorage`. The project is lightweight, fully responsive, and fun to play on both desktop and mobile, with a clean soft-3D theme and real-time scoring.

🌐 **Live Demo:** [saroj-snake-game.vercel.app](https://saroj-snake-game.vercel.app/)
***
## 📅 **Project Timeline:**

- 🌱 **Originally developed:** `[July 2025]` as a simple neon-themed desktop Snake game in a single `index.html` file.
- 🚀 **Major upgrade:** October 2026, rebuilt into a feature-rich, mobile-friendly game with a soft-3D look, new gameplay features, and a clean multi-file structure.
***
## 🎮 **Features:**
- 🎨 Clean soft-3D UI with a checkered lawn board, shaded snake, glossy apple, and gold coin
- ✒️ Polished typography using **Fredoka** and **DM Sans**
- 🧠 Smooth movement with **Arrow Keys**, **WASD**, **swipe gestures**, and an **on-screen D-pad**
- 📱 Fully responsive layout: desktop (board + info side by side), tablet, phone portrait, and phone landscape
- 🍎 Randomly placed food that never spawns on the snake
- 🌟 Gold **bonus food** worth 50 points that blinks and disappears
- 🎚️ **Easy, Normal, and Hard** difficulty modes
- 📈 Speed increases every 5 foods with a level system
- 🧱 **Solid walls** or **wrap-around walls** mode
- 🔊 Sound effects with a mute toggle, and vibration on phones when the game ends
- ⏸️ Pause and resume (Space / P / button), with auto-pause when you switch tabs
- 🏆 **Top-5 Leaderboard for each difficulty**, stored in the browser's `localStorage`
- 🥇 Personal **best score** tracked per difficulty
- 💾 Your difficulty, wall, and sound settings are remembered
- 🛑 In-game start, pause, and game-over screens (no more alert popups)
***
## 🧱 **Technologies Used:**

- HTML5 (Structure and layout)
- CSS3 (Soft-3D styling, CSS Grid responsive layout, animations)
- JavaScript (Game loop, logic & interaction, Canvas rendering)
- HTML5 Canvas (3D-style graphics, sharp on high-resolution screens)
- Web Audio API (Sound effects)
- LocalStorage (Persistent leaderboards, best scores, and settings)
***
## 🗂️ **Project Structure:**

```
Snake_Game_Project/
├── index.html    → Page structure
├── styles.css    → Soft-3D theme and responsive layout
└── script.js     → Game logic, rendering, controls, leaderboards
```
***
## 🖥️ **How to Run Locally:**

1. **Clone or Download the Project**
   git clone https://github.com/Joras-Latihd/Snake_Game_Project.git

2. **Open `index.html`**

   * Double-click the `index.html` file **or**
   * Right-click > Open with your preferred browser

3. **Start Playing!**

   * Press **Play**, or just press a direction key
   * Use the **Arrow Keys** (↑ ↓ ← →) or **WASD** to control the snake
   * On mobile, **swipe** on the board or use the **on-screen D-pad**
   * Eat red apples to grow and increase score, and grab the gold coin for a bonus
   * Press **Space** (or **P**) to pause
   * Avoid walls (in Solid mode) and your own tail!
***

## 📸 **Screenshots:**

**Home Interface**
![image alt](https://github.com/Joras-Latihd/Snake_Game_Project/blob/70c9518835f16448c25a50eb6a5792579009cdc9/Updated%20Homepage.png)

**During Gameplay**
![image alt](https://github.com/Joras-Latihd/Snake_Game_Project/blob/70c9518835f16448c25a50eb6a5792579009cdc9/Updated%20During%20Gameplay.png)
***


## 🏆 **Leaderboard System:**

 Every difficulty (**Easy**, **Normal**, **Hard**) has its own leaderboard and its own best score.
 After each game over, players who make the top 5 can **enter their name** right on the game-over screen.
 Use the **Easy / Normal / Hard** tabs to view the leaderboard of any difficulty.

 Scores persist across browser sessions.
***
## 🔧 **What Changed in the Upgrade:**

* 🗂️ Split the single file into `index.html`, `styles.css`, and `script.js`
* 🔁 Replaced `setInterval` with a `requestAnimationFrame` game loop with a fixed timestep
* 🧭 Added an input queue so fast key presses can no longer reverse the snake into itself
* 🍎 Fixed food sometimes spawning on top of the snake
* 🛡️ Leaderboard names are now inserted safely with `textContent` instead of `innerHTML`
* 🖼️ Redesigned the UI from neon glow to a soft-3D look
* 📱 Added touch controls and a responsive layout for every screen size
***
## 💡 Future Enhancements(Ideas):

* 🌐 Global online leaderboard with a Node.js and MongoDB backend
* 🤖 AI autopilot mode using pathfinding (BFS / A*)
* 📲 Installable PWA with offline support
* 🎞️ Replay system for your best run
* 👥 Local and online multiplayer support
***
## 🙌 Author

**Saroj Dhital**
*Computer Science Student & Web Enthusiast*
***
## 🌟 Show Your Support

If you liked the project:

* ⭐️ Star this repo
* 🗣 Share with your friends!
***
