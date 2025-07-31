// Main Bomb Defusal Game Script with Full AI Integration and Storage

class BombDefusalGame {
    constructor() {
        this.timeLeft = 300; // 5 minutes default
        this.timer = null;
        this.isGameActive = false;
        this.solvedWires = new Set();
        this.totalWires = 5;
        this.challenges = new BombChallenges();
        this.difficulty = 'medium';
        this.difficultySettings = {
            easy: { time: 420, name: 'Beginner' },      // 7:00
            medium: { time: 300, name: 'Expert' },       // 5:00
            hard: { time: 180, name: 'Insane' },         // 3:00
            nightmare: { time: 120, name: 'Nightmare' }   // 2:00
        };
        this.wireColors = ['red', 'blue', 'green', 'yellow', 'purple'];
        this.generatingChallenges = new Set();
        this.gameStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalTimeSpent: 0,
            bestTime: null,
            wiresSolved: 0,
            averageWireTime: 0
        };

        this.loadGameData();
        this.checkApiKey();
        this.initializeGame();
        this.setupEventListeners();
        this.generateLEDMatrix();
    }

    // ================== LOCALSTORAGE MANAGEMENT ==================
    saveGameData() {
        try {
            const gameData = {
                stats: this.gameStats,
                difficulty: this.difficulty,
                apiKey: localStorage.getItem('chatgpt_api_key'),
                lastPlayed: Date.now(),
                version: '2.0'
            };
            localStorage.setItem('bomb_defusal_data', JSON.stringify(gameData));
            console.log('💾 Game data saved successfully');
        } catch (error) {
            console.error('❌ Failed to save game data:', error);
        }
    }

    loadGameData() {
        try {
            const savedData = localStorage.getItem('bomb_defusal_data');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                if (gameData.version === '2.0') {
                    this.gameStats = { ...this.gameStats, ...gameData.stats };
                    this.difficulty = gameData.difficulty || 'medium';
                    console.log('💾 Game data loaded successfully');
                    console.log('📊 Stats:', this.gameStats);
                } else {
                    console.log('🔄 Migrating old save data...');
                    this.saveGameData(); // Save with new format
                }
            }
        } catch (error) {
            console.error('❌ Failed to load game data:', error);
            this.resetGameData();
        }
    }

    resetGameData() {
        this.gameStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalTimeSpent: 0,
            bestTime: null,
            wiresSolved: 0,
            averageWireTime: 0
        };
        this.saveGameData();
        console.log('🔄 Game data reset to defaults');
    }

    saveGameState() {
        if (!this.isGameActive) return;
        
        try {
            const gameState = {
                timeLeft: this.timeLeft,
                solvedWires: Array.from(this.solvedWires),
                difficulty: this.difficulty,
                startTime: this.gameStartTime,
                challenges: this.challenges.solutions,
                timestamp: Date.now()
            };
            localStorage.setItem('bomb_game_session', JSON.stringify(gameState));
        } catch (error) {
            console.error('❌ Failed to save game state:', error);
        }
    }

    loadGameState() {
        try {
            const savedState = localStorage.getItem('bomb_game_session');
            if (savedState) {
                const state = JSON.parse(savedState);
                const timeSinceLastSave = Date.now() - state.timestamp;
                
                // Only recover if less than 10 minutes old
                if (timeSinceLastSave < 600000) {
                    return state;
                }
            }
        } catch (error) {
            console.error('❌ Failed to load game state:', error);
        }
        return null;
    }

    clearGameState() {
        localStorage.removeItem('bomb_game_session');
    }

    checkApiKey() {
        const savedKey = localStorage.getItem('chatgpt_api_key');
        if (savedKey) {
            this.challenges.setApiKey(savedKey);
            document.getElementById('api-modal').classList.add('hidden');
        } else {
            document.getElementById('api-modal').classList.remove('hidden');
        }
    }

    async initializeGame(fromSavedState = false) {
        this.isGameActive = true;
        this.solvedWires.clear();
        this.generatingChallenges.clear();
        this.gameStartTime = Date.now();
        
        if (!fromSavedState) {
            this.timeLeft = this.difficultySettings[this.difficulty].time;
            this.challenges.reset();
        }
        
        // Update difficulty selector
        document.getElementById('difficulty').value = this.difficulty;
        
        // Initialize all wire challenges simultaneously
        if (!fromSavedState) {
            await this.initializeAllWires();
        }
        
        // Start timer
        this.startTimer();
        
        // Update UI
        this.updateStatusDisplay();
        this.hideOverlays();
        
        // Start auto-save
        this.startAutoSave();
        
        console.log(`🚨 BOMB ARMED! Difficulty: ${this.difficultySettings[this.difficulty].name}`);
        if (!fromSavedState) {
            console.log('💡 All challenges generated with full AI integration!');
        }
    }

    startAutoSave() {
        // Clear existing auto-save
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Save game state every 5 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.isGameActive) {
                this.saveGameState();
            }
        }, 5000);
    }

    async initializeAllWires() {
        const initPromises = this.wireColors.map(color => this.initializeWire(color));
        await Promise.allSettled(initPromises);
    }

    async initializeWire(wireColor) {
        this.generatingChallenges.add(wireColor);
        
        // Show loading state
        document.getElementById(`${wireColor}-title`).textContent = '⏳ GENERATING CHALLENGE...';
        document.getElementById(`${wireColor}-text`).textContent = 'AI is creating a unique challenge...';
        document.getElementById(`${wireColor}-text`).classList.add('loading');
        
        try {
            const challengeData = await this.challenges.generateChallenge(wireColor);
            
            // Update UI with generated challenge
            document.getElementById(`${wireColor}-title`).textContent = challengeData.title;
            document.getElementById(`${wireColor}-text`).textContent = challengeData.challenge;
            document.getElementById(`${wireColor}-text`).classList.remove('loading');
            document.getElementById(`${wireColor}-answer`).value = '';
            
            console.log(`✅ ${wireColor.toUpperCase()} wire challenge generated: ${challengeData.title}`);
            
        } catch (error) {
            console.error(`❌ Failed to generate ${wireColor} challenge:`, error);
            document.getElementById(`${wireColor}-title`).textContent = '❌ GENERATION FAILED';
            document.getElementById(`${wireColor}-text`).textContent = 'Error generating challenge. Click refresh to try again.';
            document.getElementById(`${wireColor}-text`).classList.remove('loading');
        }
        
        this.generatingChallenges.delete(wireColor);
    }

    setupEventListeners() {
        // Enter key handlers for all wire inputs
        this.wireColors.forEach(color => {
            const input = document.getElementById(`${color}-answer`);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.checkWireAnswer(color);
            });
            
            // Add visual feedback on focus
            input.addEventListener('focus', () => {
                input.parentElement.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.style.boxShadow = 'none';
            });
        });

        // Sound effects setup
        this.setupSoundEffects();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.isGameActive) return;
            
            // Ctrl + R: Reset game
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.resetGame();
            }
            
            // Ctrl + H: Generate hints (if API available)
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.showAllHints();
            }
            
            // Ctrl + 1-5: Focus on specific wire input
            if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const wireIndex = parseInt(e.key) - 1;
                const wireColor = this.wireColors[wireIndex];
                document.getElementById(`${wireColor}-answer`).focus();
            }

            // Ctrl + S: Save game manually
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveGameState();
                this.showTempMessage('💾 Game saved!');
            }
        });
    }

    setupSoundEffects() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.sounds = {
                tick: () => this.playBeep(800, 0.1, 0.05),
                warning: () => this.playBeep(400, 0.3, 0.1),
                success: () => this.playBeep(600, 0.2, 0.3),
                explosion: () => this.playBeep(100, 1.0, 0.5),
                defused: () => {
                    this.playBeep(523, 0.2, 0.3);
                    setTimeout(() => this.playBeep(659, 0.2, 0.3), 200);
                    setTimeout(() => this.playBeep(784, 0.4, 0.3), 400);
                },
                type: () => this.playBeep(1000, 0.05, 0.02),
                error: () => {
                    this.playBeep(200, 0.1, 0.1);
                    setTimeout(() => this.playBeep(150, 0.1, 0.1), 100);
                }
            };
        } catch (e) {
            console.log('Audio not available');
            this.sounds = {
                tick: () => {}, warning: () => {}, success: () => {},
                explosion: () => {}, defused: () => {}, type: () => {}, error: () => {}
            };
        }
    }

    playBeep(frequency, duration, volume = 0.1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // ================== TIMER MANAGEMENT ==================
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 60) {
                this.sounds.tick();
                document.getElementById('timer').classList.add('critical');
                document.getElementById('timer-warning').classList.add('show');
                
                if (this.timeLeft <= 10) {
                    this.flashScreen();
                }
            }
            
            if (this.timeLeft <= 0) {
                this.explodeBomb();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = display;
    }

    flashScreen() {
        document.body.style.background = '#ff0000';
        setTimeout(() => {
            document.body.style.background = 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%)';
        }, 100);
    }

    // ================== WIRE CHALLENGE MANAGEMENT ==================
    async checkWireAnswer(wireColor) {
        if (!this.isGameActive || this.solvedWires.has(wireColor)) return;
        
        const userAnswer = document.getElementById(`${wireColor}-answer`).value;
        
        if (!userAnswer.trim()) {
            this.showFeedback(wireColor, '⚠️ Please enter an answer', 'warning');
            return;
        }
        
        if (this.challenges.validateAnswer(wireColor, userAnswer)) {
            this.solveWire(wireColor);
        } else {
            this.wrongAnswer(wireColor, userAnswer);
        }
    }

    async generateNewChallenge(wireColor) {
        if (!this.isGameActive || this.generatingChallenges.has(wireColor)) return;
        
        // Clear current answer
        document.getElementById(`${wireColor}-answer`).value = '';
        
        // Generate new challenge
        await this.initializeWire(wireColor);
        
        console.log(`🔄 New ${wireColor} challenge generated`);
    }

    solveWire(wireColor) {
        this.solvedWires.add(wireColor);
        this.sounds.success();
        
        // Update stats
        this.gameStats.wiresSolved++;
        
        // Update wire status
        document.getElementById(`${wireColor}-status`).textContent = 'DEFUSED';
        document.getElementById(`${wireColor}-status`).classList.add('solved');
        
        // Mark wire module as solved
        document.querySelector(`[data-wire="${wireColor}"]`).classList.add('solved');
        
        // Disable input
        document.getElementById(`${wireColor}-answer`).disabled = true;
        document.getElementById(`${wireColor}-answer`).style.background = '#004400';
        
        // Show success feedback
        this.showFeedback(wireColor, '✅ WIRE DEFUSED!', 'success');
        
        // Update progress
        this.updateStatusDisplay();
        this.updateLEDMatrix();
        
        // Save progress
        this.saveGameState();
        
        // Check if all wires are solved
        if (this.solvedWires.size === this.totalWires) {
            setTimeout(() => this.defuseBomb(), 1000);
        }
        
        console.log(`✅ ${wireColor.toUpperCase()} WIRE DEFUSED! (${this.solvedWires.size}/${this.totalWires})`);
    }

    async wrongAnswer(wireColor, userAnswer) {
        const input = document.getElementById(`${wireColor}-answer`);
        
        // Visual feedback
        input.style.background = '#440000';
        input.classList.add('shake');
        
        // Screen shake effect
        document.body.style.animation = 'shake 0.5s ease-in-out';
        
        // Play error sound
        this.sounds.error();
        
        // Show feedback
        const feedback = this.challenges.analyzeWrongAnswer(wireColor, userAnswer);
        this.showFeedback(wireColor, feedback, 'error');
        
        // Time penalties based on difficulty
        const penalties = {
            easy: 0,
            medium: 3,
            hard: 5,
            nightmare: 10
        };
        
        const penalty = penalties[this.difficulty] || 0;
        if (penalty > 0) {
            this.timeLeft = Math.max(0, this.timeLeft - penalty);
            this.showFeedback(wireColor, `⏰ -${penalty}s time penalty!`, 'warning');
        }
        
        // Reset visual effects
        setTimeout(() => {
            input.style.background = '#000';
            input.classList.remove('shake');
            document.body.style.animation = '';
        }, 500);
        
        console.log(`❌ Wrong answer for ${wireColor} wire: "${userAnswer}"`);
    }

    showFeedback(wireColor, message, type = 'info') {
        const challengeText = document.getElementById(`${wireColor}-text`);
        const originalText = challengeText.textContent;
        
        // Show feedback
        challengeText.textContent = message;
        challengeText.style.color = type === 'success' ? '#00ff00' : 
                                   type === 'error' ? '#ff4444' :
                                   type === 'warning' ? '#ffaa00' : '#00ffff';
        
        // Restore original text after delay
        setTimeout(() => {
            if (!this.solvedWires.has(wireColor)) {
                challengeText.textContent = originalText;
                challengeText.style.color = '';
            }
        }, 2000);
    }

    showTempMessage(message, duration = 2000) {
        // Create temporary message overlay
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 0, 0.9);
            color: #000;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: 'Orbitron', monospace;
            font-weight: bold;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => document.body.removeChild(messageDiv), 300);
        }, duration);
    }

    async showAllHints() {
        for (const wireColor of this.wireColors) {
            if (!this.solvedWires.has(wireColor)) {
                try {
                    const hint = await this.challenges.generateHint(wireColor);
                    this.showFeedback(wireColor, hint, 'info');
                } catch (error) {
                    console.error(`Failed to generate hint for ${wireColor}:`, error);
                }
            }
        }
    }

    // ================== GAME STATES ==================
    defuseBomb() {
        this.isGameActive = false;
        clearInterval(this.timer);
        clearInterval(this.autoSaveInterval);
        
        // Calculate game stats
        const gameTime = this.difficultySettings[this.difficulty].time - this.timeLeft;
        const timeBonus = Math.floor(this.timeLeft * 10);
        
        // Update stats
        this.gameStats.gamesPlayed++;
        this.gameStats.gamesWon++;
        this.gameStats.totalTimeSpent += gameTime;
        
        if (!this.gameStats.bestTime || gameTime < this.gameStats.bestTime) {
            this.gameStats.bestTime = gameTime;
        }
        
        this.gameStats.averageWireTime = Math.floor(this.gameStats.totalTimeSpent / this.gameStats.wiresSolved);
        
        // Save updated stats
        this.saveGameData();
        this.clearGameState();
        
        // Play success sound
        this.sounds.defused();
        
        // Update bonus display
        document.getElementById('time-bonus').innerHTML = `
            <div>Time Bonus: ${timeBonus} points</div>
            <div>Completion Time: ${Math.floor(gameTime / 60)}:${(gameTime % 60).toString().padStart(2, '0')}</div>
            <div>Best Time: ${Math.floor(this.gameStats.bestTime / 60)}:${(this.gameStats.bestTime % 60).toString().padStart(2, '0')}</div>
        `;
        
        // Show success overlay
        document.getElementById('success-overlay').classList.add('show');
        
        // Update status
        document.getElementById('status-display').innerHTML = `
            <div class="status-text" style="color: #00ff00;">💚 BOMB DEFUSED! 💚</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 100%; background: #00ff00;"></div>
            </div>
        `;
        
        // Celebration effect
        this.celebrationEffect();
        
        console.log('🎉 MISSION ACCOMPLISHED! BOMB DEFUSED!');
        console.log('📊 Updated Stats:', this.gameStats);
    }

    explodeBomb() {
        this.isGameActive = false;
        clearInterval(this.timer);
        clearInterval(this.autoSaveInterval);
        
        // Update stats
        const gameTime = this.difficultySettings[this.difficulty].time - this.timeLeft;
        this.gameStats.gamesPlayed++;
        this.gameStats.totalTimeSpent += gameTime;
        
        // Save updated stats
        this.saveGameData();
        this.clearGameState();
        
        // Play explosion sound
        this.sounds.explosion();
        
        // Show explosion overlay
        document.getElementById('explosion-overlay').classList.add('show');
        
        // Add explosion effect to bomb
        document.querySelector('.bomb-container').style.animation = 'explosion 2s ease-out infinite';
        
        // Update timer to show 00:00
        document.getElementById('timer').textContent = '00:00';
        
        console.log('💥 BOOM! MISSION FAILED!');
        console.log('📊 Updated Stats:', this.gameStats);
    }

    celebrationEffect() {
        // Add celebration visual effects
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'];
        let colorIndex = 0;
        
        const celebration = setInterval(() => {
            document.body.style.background = `linear-gradient(45deg, ${colors[colorIndex]}, ${colors[(colorIndex + 1) % colors.length]})`;
            colorIndex = (colorIndex + 1) % colors.length;
        }, 200);
        
        setTimeout(() => {
            clearInterval(celebration);
            document.body.style.background = 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%)';
        }, 3000);
    }

    // ================== UI UPDATES ==================
    updateStatusDisplay() {
        const progress = (this.solvedWires.size / this.totalWires) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        const statusText = this.solvedWires.size === 0 ? 
            'ARMED - DEFUSE ALL WIRES' : 
            `${this.solvedWires.size}/${this.totalWires} WIRES DEFUSED`;
            
        document.querySelector('.status-text').textContent = statusText;
    }

    generateLEDMatrix() {
        const ledMatrix = document.getElementById('led-matrix');
        ledMatrix.innerHTML = '';
        
        // Create 200 LEDs (20x10 grid)
        for (let i = 0; i < 200; i++) {
            const led = document.createElement('div');
            led.className = 'led';
            ledMatrix.appendChild(led);
        }
        
        this.updateLEDMatrix();
    }

    updateLEDMatrix() {
        const leds = document.querySelectorAll('.led');
        const totalLeds = leds.length;
        const activeLeds = Math.floor((this.solvedWires.size / this.totalWires) * totalLeds);
        
        // Clear all LEDs
        leds.forEach(led => led.classList.remove('active'));
        
        // Activate LEDs based on progress
        for (let i = 0; i < activeLeds; i++) {
            leds[i].classList.add('active');
        }
        
        // Add random flickering for effect
        if (this.isGameActive && this.ledFlickerInterval) {
            clearInterval(this.ledFlickerInterval);
        }
        
        if (this.isGameActive) {
            this.ledFlickerInterval = setInterval(() => {
                if (Math.random() < 0.1) {
                    const randomLed = leds[Math.floor(Math.random() * totalLeds)];
                    randomLed.classList.toggle('active');
                    setTimeout(() => randomLed.classList.toggle('active'), 100);
                }
            }, 500);
        }
    }

    hideOverlays() {
        document.getElementById('explosion-overlay').classList.remove('show');
        document.getElementById('success-overlay').classList.remove('show');
    }

    // ================== GAME CONTROLS ==================
    async resetGame(fullReset = false) {
        // Clear all timers and intervals
        if (this.timer) clearInterval(this.timer);
        if (this.ledFlickerInterval) clearInterval(this.ledFlickerInterval);
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
        
        // Clear game state if full reset
        if (fullReset) {
            this.clearGameState();
        }
        
        // Reset all wire statuses
        this.wireColors.forEach(color => {
            document.getElementById(`${color}-status`).textContent = 'ARMED';
            document.getElementById(`${color}-status`).classList.remove('solved');
            document.querySelector(`[data-wire="${color}"]`).classList.remove('solved');
            
            // Reset inputs
            const input = document.getElementById(`${color}-answer`);
            input.value = '';
            input.disabled = false;
            input.style.background = '#000';
            
            // Reset challenge display
            document.getElementById(`${color}-title`).textContent = '⏳ LOADING...';
            document.getElementById(`${color}-text`).textContent = 'Generating new challenge...';
        });
        
        // Reset timer display
        document.getElementById('timer').classList.remove('critical');
        document.getElementById('timer-warning').classList.remove('show');
        
        // Reset bomb container animation
        document.querySelector('.bomb-container').style.animation = 'bombGlow 2s ease-in-out infinite alternate';
        
        // Reinitialize game
        await this.initializeGame();
        
        console.log('🔄 GAME RESET - NEW MISSION STARTED');
        this.showTempMessage('🔄 New mission started!');
    }

    async playAgain() {
        console.log('🎮 PLAY AGAIN - Starting new game...');
        await this.resetGame(true); // Full reset including saved state
        this.showTempMessage('🎮 New game started!');
    }

    changeDifficulty() {
        const select = document.getElementById('difficulty');
        const newDifficulty = select.value;
        
        if (this.isGameActive) {
            const confirmReset = confirm(`Changing difficulty will reset the current game. Continue?`);
            if (confirmReset) {
                this.difficulty = newDifficulty;
                this.saveGameData(); // Save new difficulty
                this.resetGame(true);
            } else {
                // Revert selection
                select.value = this.difficulty;
                return;
            }
        }
        
        this.difficulty = newDifficulty;
        this.saveGameData(); // Save new difficulty
        console.log(`🎯 Difficulty changed to: ${this.difficultySettings[this.difficulty].name}`);
    }

    toggleInstructions() {
        const instructions = document.getElementById('instructions');
        instructions.classList.toggle('show');
    }

    showApiModal() {
        document.getElementById('api-modal').classList.remove('hidden');
    }

    // ================== RECOVERY SYSTEM ==================
    async recoverGame() {
        const savedState = this.loadGameState();
        if (!savedState) return false;
        
        try {
            // Restore game state
            this.timeLeft = savedState.timeLeft;
            this.difficulty = savedState.difficulty;
            this.solvedWires = new Set(savedState.solvedWires);
            this.gameStartTime = savedState.startTime;
            this.challenges.solutions = savedState.challenges;
            
            // Restore UI state
            savedState.solvedWires.forEach(wireColor => {
                document.getElementById(`${wireColor}-status`).textContent = 'DEFUSED';
                document.getElementById(`${wireColor}-status`).classList.add('solved');
                document.querySelector(`[data-wire="${wireColor}"]`).classList.add('solved');
                
                const input = document.getElementById(`${wireColor}-answer`);
                input.disabled = true;
                input.style.background = '#004400';
            });
            
            await this.initializeGame(true);
            
            console.log('🔄 Game recovered successfully!');
            this.showTempMessage('🔄 Game recovered!');
            return true;
        } catch (error) {
            console.error('❌ Failed to recover game:', error);
            this.clearGameState();
            return false;
        }
    }

    // ================== STATISTICS DISPLAY ==================
    showStats() {
        const winRate = this.gameStats.gamesPlayed > 0 
            ? Math.round((this.gameStats.gamesWon / this.gameStats.gamesPlayed) * 100) 
            : 0;
        
        const avgGameTime = this.gameStats.gamesPlayed > 0
            ? Math.floor(this.gameStats.totalTimeSpent / this.gameStats.gamesPlayed)
            : 0;

        const bestTimeFormatted = this.gameStats.bestTime
            ? `${Math.floor(this.gameStats.bestTime / 60)}:${(this.gameStats.bestTime % 60).toString().padStart(2, '0')}`
            : 'N/A';

        const statsMessage = `
📊 BOMB DEFUSAL STATISTICS 📊

🎮 Games Played: ${this.gameStats.gamesPlayed}
🏆 Games Won: ${this.gameStats.gamesWon}
📈 Win Rate: ${winRate}%
⏱️ Best Time: ${bestTimeFormatted}
🔧 Wires Defused: ${this.gameStats.wiresSolved}
⚡ Average Wire Time: ${this.gameStats.averageWireTime}s
        `;

        alert(statsMessage);
        console.log(statsMessage);
    }

    clearStats() {
        const confirm = window.confirm('Are you sure you want to clear all statistics? This cannot be undone.');
        if (confirm) {
            this.resetGameData();
            this.showTempMessage('📊 Statistics cleared!');
            console.log('📊 All statistics have been cleared');
        }
    }
}

// ================== GLOBAL FUNCTIONS ==================
let game;

// Wire challenge functions
function checkWireAnswer(wireColor) {
    game.checkWireAnswer(wireColor);
}

function generateNewChallenge(wireColor) {
    game.generateNewChallenge(wireColor);
}

// Game control functions
function resetGame() {
    game.resetGame();
}

function playAgain() {
    game.playAgain();
}

function changeDifficulty() {
    game.changeDifficulty();
}

function toggleInstructions() {
    game.toggleInstructions();
}

function showApiModal() {
    game.showApiModal();
}

function showStats() {
    game.showStats();
}

function clearStats() {
    game.clearStats();
}

function saveApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    
    if (!apiKey) {
        alert('Please enter a valid API key!');
        return;
    }
    
    if (!apiKey.startsWith('sk-')) {
        const confirm = window.confirm('This doesn\'t look like a valid OpenAI API key (should start with "sk-"). Continue anyway?');
        if (!confirm) return;
    }
    
    // Save API key
    localStorage.setItem('chatgpt_api_key', apiKey);
    game.challenges.setApiKey(apiKey);
    
    // Hide modal
    document.getElementById('api-modal').classList.add('hidden');
    
    // Reset game to generate new challenges with API
    game.resetGame();
    
    console.log('🔑 API Key saved and system activated!');
    game.showTempMessage('🔑 API Key activated!');
}

// Add CSS for animations
const enhancedStyle = document.createElement('style');
enhancedStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
        animation: shake 0.6s ease-in-out;
    }
    
    @keyframes explosion {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.05) rotate(-2deg); }
        50% { transform: scale(1.1) rotate(2deg); }
        75% { transform: scale(1.05) rotate(-1deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
    
    @keyframes wireGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.3); }
        50% { box-shadow: 0 0 40px rgba(0, 255, 0, 0.8); }
    }
    
    .wire-module.solved {
        animation: wireGlow 2s ease-in-out infinite;
    }
    
    @keyframes typeWriter {
        from { width: 0; }
        to { width: 100%; }
    }
    
    .challenge-text.typing {
        overflow: hidden;
        border-right: 2px solid #00ff00;
        white-space: nowrap;
        animation: typeWriter 2s steps(40, end);
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    
    .loading {
        animation: pulse 1.5s ease-in-out infinite;
    }
    
    input[type="text"]:focus, input[type="password"]:focus {
        transform: scale(1.02);
        transition: transform 0.2s ease;
    }
    
    .solve-btn:active, .refresh-btn:active {
        transform: scale(0.95);
    }
    
    .challenge-container {
        transition: all 0.3s ease;
    }
    
    .wire-module:hover .challenge-container {
        transform: translateY(-2px);
    }

    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .overlay-buttons {
        display: flex;
        gap: 15px;
        margin-top: 20px;
        justify-content: center;
        flex-wrap: wrap;
    }

    .overlay-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-family: 'Orbitron', monospace;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
        text-transform: uppercase;
        min-width: 120px;
    }

    .overlay-btn.primary {
        background: linear-gradient(45deg, #2ed573, #1e90ff);
        color: white;
    }

    .overlay-btn.secondary {
        background: linear-gradient(45deg, #ff6b6b, #ff8e53);
        color: white;
    }

    .overlay-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .stats-display {
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #ffd700;
        border-radius: 10px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
        color: #00ff00;
        font-family: 'Courier Prime', monospace;
    }
`;
document.head.appendChild(enhancedStyle);

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new BombDefusalGame();
    
    // Check for recovery on page load
    setTimeout(() => {
        const savedState = game.loadGameState();
        if (savedState) {
            const timeSinceLastSave = Date.now() - savedState.timestamp;
            
            // Only offer recovery if less than 10 minutes old
            if (timeSinceLastSave < 600000) {
                const recover = confirm(`🔄 Detected previous game session from ${Math.floor(timeSinceLastSave / 1000)} seconds ago. Would you like to recover it?`);
                if (recover) {
                    game.recoverGame();
                } else {
                    game.clearGameState();
                }
            } else {
                game.clearGameState();
            }
        }
    }, 1000);
    
    // console introduction
    console.log(`
    🚨🚨🚨 BOMB DEFUSAL SIMULATION ACTIVATED 🚨🚨🚨
    
    ⚡ FEATURES:
    ✅ Full ChatGPT AI Integration for ALL 5 wires
    ✅ Dynamic question generation on every refresh  
    ✅ Advanced localStorage save system
    ✅ Complete game statistics tracking
    ✅ Auto-save & recovery system
    ✅ Reset & Play Again functions
    ✅ 4 difficulty levels with time penalties
    ✅ Real-time audio feedback & visual effects
    ✅ Keyboard shortcuts & accessibility features
    
    🎯 WIRE TYPES:
    🔴 RED: Mathematical riddles & brain teasers
    🔵 BLUE: Computer science algorithms & data structures  
    🟢 GREEN: Programming logic & computational thinking
    🟡 YELLOW: Cryptography & security challenges
    🟣 PURPLE: Advanced algorithms & graph theory
    
    ⌨️  SHORTCUTS:
    - Ctrl+R: Reset game
    - Ctrl+H: Get hints (requires API)
    - Ctrl+S: Manual save
    - Ctrl+1-5: Focus on wire inputs
    - Enter: Submit answer
    
    🔧 DEBUG COMMANDS:
    - game.solveWire('red'): Solve specific wire
    - game.timeLeft = 60: Set timer
    - game.explodeBomb(): Trigger explosion
    - game.showStats(): View statistics
    - game.clearStats(): Clear all stats
    - game.recoverGame(): Recover saved game
    - game.saveGameState(): Manual save
    
    💾 STORAGE FEATURES:
    - Auto-save every 5 seconds
    - Game recovery on page reload
    - Persistent statistics tracking
    - API key storage
    - Difficulty preference saving
    
    💀 DIFFICULTY LEVELS:
    🟢 Beginner: 7:00, no penalties
    🟡 Expert: 5:00, -3s wrong answer penalty  
    🟠 Insane: 3:00, -5s wrong answer penalty
    🔴 Nightmare: 2:00, -10s wrong answer penalty
    
    🔑 Setup your ChatGPT API key for full AI-powered challenges!
    Without API key, advanced fallback challenges will be used.
    
    Good luck, agent. The fate of the world is in your hands! 💣⏰
    `);
    
    // Add konami code easter egg with features
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
            // Easter egg: Multiple bonuses
            game.timeLeft += 120; // +2 minutes
            
            // Visual celebration
            document.body.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)';
            document.body.style.animation = 'rainbow 2s ease-in-out infinite';
            
            // Audio celebration
            game.sounds.defused();
            
            setTimeout(() => {
                document.body.style.background = 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%)';
                document.body.style.animation = '';
            }, 3000);
            
            game.showTempMessage('🎉 KONAMI CODE! +2 minutes bonus!', 3000);
            
            console.log('🎉 KONAMI CODE ACTIVATED! 🎉');
            console.log('💰 BONUSES UNLOCKED:');
            console.log('   ✅ +120 seconds bonus time');
            console.log('   ✅ Visual celebration effect');
            console.log('   ✅ Achievement unlocked: "Code Master"');
            
            konamiCode = [];
        }
    });
    
    // Auto-cleanup old localStorage entries
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('bomb_') && key !== 'bomb_defusal_data' && key !== 'bomb_game_session') {
                localStorage.removeItem(key);
                console.log(`🧹 Cleaned up old storage key: ${key}`);
            }
        });
    } catch (e) {
        console.log('❌ Failed to cleanup old storage');
    }
    
    // Performance monitoring for optimization
    const perfObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure' && entry.duration > 100) {
                console.warn(`⚠️  Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms (slow)`);
            }
        });
    });
    
    try {
        perfObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (e) {
        console.log('💡 Performance Observer not supported in this browser');
    }
});

// Global error handler for graceful degradation
window.addEventListener('error', (e) => {
    console.error('🚨 Global error caught:', e.error);
    
    // Try to maintain game state even with errors
    if (game && game.isGameActive) {
        console.log('🛡️  Game continues despite error - implementing fallback');
        // Auto-save in case of error
        try {
            game.saveGameState();
        } catch (saveError) {
            console.error('❌ Failed to save game state after error:', saveError);
        }
    }
});

// Prevent accidental page refresh during active game
window.addEventListener('beforeunload', (e) => {
    if (game && game.isGameActive && game.solvedWires.size > 0) {
        // Save game state before leaving
        try {
            game.saveGameState();
        } catch (error) {
            console.error('❌ Failed to save before unload:', error);
        }
        
        e.preventDefault();
        e.returnValue = 'You have an active bomb defusal in progress. Your progress will be saved. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// Storage quota warning
if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
        const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
        const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
        const usagePercent = ((estimate.usage / estimate.quota) * 100).toFixed(1);
        
        console.log(`💾 Storage Usage: ${usedMB}MB / ${quotaMB}MB (${usagePercent}%)`);
        
        if (usagePercent > 80) {
            console.warn('⚠️  Storage usage is high. Consider clearing old data.');
        }
    });
}

console.log('🚀 Bomb Defusal System fully loaded and operational!');