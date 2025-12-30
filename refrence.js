document.addEventListener('DOMContentLoaded', () => {
    const els = {
        health: document.getElementById('health-bar'),
        fuel: document.getElementById('fuel-bar'),
        healthPercent: document.getElementById('health-percent'),
        fuelPercent: document.getElementById('fuel-percent'),
        fuelDisplay: document.getElementById('fuel-display'),
        healthDisplay: document.getElementById('health-display'),
        leftSignal: document.getElementById('left-signal'),
        rightSignal: document.getElementById('right-signal'),
        headlightContainer: document.getElementById('headlight-container'),
        lowBeam: document.getElementById('low-beam'),
        highBeam: document.getElementById('high-beam'),
        seatbeltContainer: document.getElementById('seatbelt-container'),
        seatbeltIndicator: document.getElementById('seatbelt-indicator'),
        speed: document.getElementById('speed-display'),
        gear: document.getElementById('gear-display'),
        unit: document.getElementById('speed-unit'),
        rpm: document.getElementById('rpm-boxes'),
        icons: {
            engine: document.getElementById('icon-engine'),
            lights: document.getElementById('icon-lights'),
            left: document.getElementById('icon-left'),
            right: document.getElementById('icon-right'),
            seatbelt: document.getElementById('icon-seatbelt')
        },
        audio: {
            tick: document.getElementById('audio-tick'),
            alarm: document.getElementById('audio-alarm'),
            seatbeltWarning1: document.getElementById('seatbelt-warning1'),
            seatbeltWarning2: document.getElementById('seatbelt-warning2'),
            engineWarning1: document.getElementById('engine-warning1'),
            engineWarning2: document.getElementById('engine-warning2'),
            fuelWarning1: document.getElementById('fuel-warning1'),
            fuelWarning2: document.getElementById('fuel-warning2')
        }
    };

    const vehicleState = {
        engineOn: false,
        hasMoved: false,
        isMotorcycle: false,
        fuelLevel: 100, // Store last fuel level
        healthLevel: 100, // Store last health level
        engineWarning50Played: false, // Track if 50% health warning was played
        engineWarning20Played: false, // Track if 20% health warning was played
        fuelWarning50Played: false, // Track if 50% fuel warning was played
        fuelWarning10Played: false  // Track if 10% fuel warning was played
    };

    const manageLoopingAudio = (audioEl, shouldPlay) => {
        // Audio disabled - function does nothing
        return;
    };

    const manageSeatbeltAudio = (shouldPlay) => {
        if (els.audio.seatbeltWarning1 && els.audio.seatbeltWarning2) {
            if (shouldPlay) {
                // Get volume from CSS custom property
                const volume = parseFloat(getComputedStyle(els.audio.seatbeltWarning1).getPropertyValue('--seatbelt-volume')) || 0.5;
                els.audio.seatbeltWarning1.volume = volume;
                els.audio.seatbeltWarning2.volume = volume;

                // Play both warning sounds
                els.audio.seatbeltWarning1.play().catch(() => { });
                els.audio.seatbeltWarning2.play().catch(() => { });
            } else {
                // Stop both warning sounds
                els.audio.seatbeltWarning1.pause();
                els.audio.seatbeltWarning2.pause();
                els.audio.seatbeltWarning1.currentTime = 0;
                els.audio.seatbeltWarning2.currentTime = 0;
            }
        }
    };

    const audioQueue = [];
    let isPlayingAudio = false;

    const playNextAudio = () => {
        if (audioQueue.length === 0 || isPlayingAudio) return;

        isPlayingAudio = true;
        const audioInfo = audioQueue.shift();
        const audioElement = audioInfo.element;

        if (audioElement) {
            audioElement.volume = audioInfo.volume;
            audioElement.currentTime = 0;

            audioElement.onended = () => {
                isPlayingAudio = false;
                setTimeout(playNextAudio, 500); // 500ms delay between audio
            };

            audioElement.play().catch(() => {
                isPlayingAudio = false;
                setTimeout(playNextAudio, 500);
            });
        } else {
            isPlayingAudio = false;
            setTimeout(playNextAudio, 500);
        }
    };

    const queueAudio = (element, volumeProperty) => {
        if (!element) return;
        const volume = parseFloat(getComputedStyle(element).getPropertyValue(volumeProperty)) || 0.3;
        audioQueue.push({ element, volume });
        playNextAudio();
    };

    const toggleIcon = (id, state) => {
        if (els.icons[id]) {
            els.icons[id].classList.toggle('active', !!state);
        }
    };

    // Function to change speedometer background color and opacity
    window.setSpeedoBackground = (r, g, b, opacity = null) => {
        const root = document.documentElement;
        root.style.setProperty('--speedo-bg-color', `${r}, ${g}, ${b}`);
        if (opacity !== null) {
            root.style.setProperty('--speedo-bg-opacity', opacity);
        }
    };

    // Function to change only opacity
    window.setSpeedoOpacity = (opacity) => {
        const root = document.documentElement;
        root.style.setProperty('--speedo-bg-opacity', opacity);
    };

    // Functions to change bar positions within speedo-root
    window.setLeftBarPosition = (position = 'static', top = 'auto', right = 'auto', bottom = 'auto', left = 'auto', alignSelf = 'flex-start') => {
        const root = document.documentElement;
        root.style.setProperty('--left-bars-position', position);
        root.style.setProperty('--left-bars-top', top);
        root.style.setProperty('--left-bars-right', right);
        root.style.setProperty('--left-bars-bottom', bottom);
        root.style.setProperty('--left-bars-left', left);
        root.style.setProperty('--left-bars-align-self', alignSelf);
    };

    window.setRightBarPosition = (position = 'static', top = 'auto', right = 'auto', bottom = 'auto', left = 'auto', alignSelf = 'flex-start') => {
        const root = document.documentElement;
        root.style.setProperty('--right-bars-position', position);
        root.style.setProperty('--right-bars-top', top);
        root.style.setProperty('--right-bars-right', right);
        root.style.setProperty('--right-bars-bottom', bottom);
        root.style.setProperty('--right-bars-left', left);
        root.style.setProperty('--right-bars-align-self', alignSelf);
    };

    // Function to center bars within speedo-root
    window.centerBars = () => {
        setLeftBarPosition('static', 'auto', 'auto', 'auto', 'auto', 'center');
        setRightBarPosition('static', 'auto', 'auto', 'auto', 'auto', 'center');
    };

    // Function to position bars anywhere on screen
    window.setBarsPosition = (leftPos, rightPos) => {
        if (leftPos) {
            setLeftBarPosition(leftPos.position || 'fixed', leftPos.top, leftPos.right, leftPos.bottom, leftPos.left);
        }
        if (rightPos) {
            setRightBarPosition(rightPos.position || 'fixed', rightPos.top, rightPos.right, rightPos.bottom, rightPos.left);
        }
    };

    window.setVehicleType = (type) => {
        vehicleState.isMotorcycle = type === 'motorcycle';

        // Update seatbelt visibility for motorcycles
        if (els.seatbeltContainer) {
            if (vehicleState.isMotorcycle) {
                els.seatbeltContainer.classList.add('motorcycle');
            } else {
                els.seatbeltContainer.classList.remove('motorcycle');
            }
        }

        if (els.icons.seatbelt) {
            if (vehicleState.isMotorcycle) {
                els.icons.seatbelt.style.display = 'none';
                manageLoopingAudio(els.audio.alarm, false); // Disable alarm for motorcycles
            } else {
                els.icons.seatbelt.style.display = '';
            }
        }
    };

    // RPM boxes
    if (els.rpm) {
        for (let i = 0; i < 10; i++) {
            const box = document.createElement('div');
            box.className = 'rpm-box';
            els.rpm.appendChild(box);
        }
        const rpmBoxes = Array.from(els.rpm.children);
        window.setRPM = (rpm) => {
            const active = Math.round(Math.max(0, Math.min(1, rpm)) * 10);
            rpmBoxes.forEach((box, i) => {
                box.classList.toggle('on', i < active);
                // Add gear warning when RPM is high (80%+)
                box.classList.toggle('gear-warning', rpm >= 0.8 && i < active);
            });

            // Update gear display warning based on RPM
            if (els.gear) {
                els.gear.classList.toggle('gear-warning', rpm >= 0.8);
            }
        };
    } else {
        window.setRPM = () => { };
    }

    window.setSpeed = (speed) => {
        if (!els.speed) return;
        const val = Math.round(Math.max(0, speed * 2.23694));
        els.speed.textContent = val;
        if (val > 0) vehicleState.hasMoved = true;

        // Update speed display color based on engine state and speed
        const root = document.documentElement;
        if (!vehicleState.engineOn) {
            // Engine off = white
            root.style.setProperty('--speed-color', '#ffffff');
            root.style.setProperty('--speed-glow', 'rgba(255, 255, 255, 0.8)');
        } else if (val >= 1 && val <= 40) {
            // 1-40 mph = green
            root.style.setProperty('--speed-color', '#00ff41');
            root.style.setProperty('--speed-glow', 'rgba(0, 255, 65, 0.8)');
        } else if (val >= 41 && val <= 50) {
            // 40-50 mph = yellow
            root.style.setProperty('--speed-color', '#ffff00');
            root.style.setProperty('--speed-glow', 'rgba(255, 255, 0, 0.8)');
        } else if (val > 50) {
            // Above 50 mph = red
            root.style.setProperty('--speed-color', '#ff0000');
            root.style.setProperty('--speed-glow', 'rgba(255, 0, 0, 0.8)');
        } else {
            // 0 mph with engine on = white
            root.style.setProperty('--speed-color', '#ffffff');
            root.style.setProperty('--speed-glow', 'rgba(255, 255, 255, 0.8)');
        }
    };

    window.setGear = (gear) => {
        if (!els.gear) return;

        let gearText;
        if (!vehicleState.engineOn) {
            gearText = 'N';
        } else {
            if (gear > 0) {
                gearText = gear;
            } else if (gear === 0 && vehicleState.hasMoved) {
                gearText = 'R';
            } else {
                gearText = 'N';
            }
        }

        const upperGear = String(gearText).toUpperCase();
        els.gear.textContent = upperGear;
        els.gear.classList.toggle('gear-reverse', upperGear === 'R');
    };

    window.setFuel = (val) => {
        const p = Math.max(0, Math.min(1, val));
        const percentage = p * 100;

        // Store the fuel level
        vehicleState.fuelLevel = percentage;

        // Update old fuel bar if it exists
        if (els.fuel) {
            els.fuel.style.transform = `translateY(${100 - percentage}%)`;
        }

        // Update old percentage text if it exists
        if (els.fuelPercent) {
            els.fuelPercent.textContent = Math.round(percentage) + '%';
        }

        // Update new fuel display
        if (els.fuelDisplay) {
            if (!vehicleState.engineOn) {
                // Engine off - show 0%
                els.fuelDisplay.textContent = '0%';
                els.fuelDisplay.classList.remove('fuel-blink');
                // Set color to dim white when engine off
                const root = document.documentElement;
                root.style.setProperty('--fuel-color', 'rgba(255, 255, 255, 0.5)');
                root.style.setProperty('--fuel-glow', 'rgba(255, 255, 255, 0.3)');
            } else {
                // Engine on - show actual fuel level
                els.fuelDisplay.textContent = Math.round(percentage) + '%';

                // Update colors and blinking based on fuel percentage
                const root = document.documentElement;
                if (percentage >= 50) {
                    // Green for 50% and above
                    root.style.setProperty('--fuel-color', '#00ff00');
                    root.style.setProperty('--fuel-glow', 'rgba(0, 255, 0, 0.8)');
                    els.fuelDisplay.classList.remove('fuel-blink');
                } else if (percentage >= 20) {
                    // Yellow for 20-49% - Play fuel-warning1 while in 50% to 20% range
                    root.style.setProperty('--fuel-color', '#ffff00');
                    root.style.setProperty('--fuel-glow', 'rgba(255, 255, 0, 0.8)');
                    els.fuelDisplay.classList.remove('fuel-blink');

                    // Play fuel-warning1 while fuel is between 50% and 20%
                    if (vehicleState.engineOn && percentage < 50) {
                        queueAudio(els.audio.fuelWarning1, '--fuel-volume');
                    }
                } else {
                    // Red for under 20% - Play fuel-warning2 while in 20% to 0% range
                    root.style.setProperty('--fuel-color', '#ff0000');
                    root.style.setProperty('--fuel-glow', 'rgba(255, 0, 0, 0.8)');

                    // Add blinking for very low fuel (under 10%)
                    if (percentage < 10) {
                        els.fuelDisplay.classList.add('fuel-blink');
                    } else {
                        els.fuelDisplay.classList.remove('fuel-blink');
                    }

                    // Play fuel-warning2 while fuel is between 20% and 0%
                    if (vehicleState.engineOn && percentage < 20) {
                        queueAudio(els.audio.fuelWarning2, '--fuel-volume');
                    }
                }
            }
        }
    };

    window.setHealth = (val) => {
        const p = Math.max(0, Math.min(1, val));
        const percentage = p * 100;

        // Store the health level
        vehicleState.healthLevel = percentage;

        // Update old health bar if it exists
        if (els.health) {
            els.health.style.transform = `translateY(${100 - percentage}%)`;
        }

        // Update old percentage text if it exists
        if (els.healthPercent) {
            els.healthPercent.textContent = Math.round(percentage) + '%';
        }

        // Update new health display
        if (els.healthDisplay) {
            if (!vehicleState.engineOn) {
                // Engine off - show 0%
                els.healthDisplay.textContent = '0%';
                els.healthDisplay.classList.remove('health-blink');
                // Set color to dim white when engine off
                const root = document.documentElement;
                root.style.setProperty('--health-color', 'rgba(255, 255, 255, 0.5)');
                root.style.setProperty('--health-glow', 'rgba(255, 255, 255, 0.3)');
            } else {
                // Engine on - show actual health level
                els.healthDisplay.textContent = Math.round(percentage) + '%';

                // Update colors and blinking based on health percentage
                const root = document.documentElement;
                if (percentage >= 50) {
                    // Green for 50% and above
                    root.style.setProperty('--health-color', '#00ff00');
                    root.style.setProperty('--health-glow', 'rgba(0, 255, 0, 0.8)');
                    els.healthDisplay.classList.remove('health-blink');
                } else if (percentage >= 20) {
                    // Yellow for 20-49% - Play engine-warning1 while in 50% to 20% range
                    root.style.setProperty('--health-color', '#ffff00');
                    root.style.setProperty('--health-glow', 'rgba(255, 255, 0, 0.8)');
                    els.healthDisplay.classList.remove('health-blink');

                    // Play engine-warning1 while health is between 50% and 20%
                    if (vehicleState.engineOn && percentage < 50) {
                        queueAudio(els.audio.engineWarning1, '--engine-volume');
                    }
                } else {
                    // Red for under 20% - Play engine-warning2 while in 20% to 0% range
                    root.style.setProperty('--health-color', '#ff0000');
                    root.style.setProperty('--health-glow', 'rgba(255, 0, 0, 0.8)');

                    // Add blinking for very low health (under 10%)
                    if (percentage < 10) {
                        els.healthDisplay.classList.add('health-blink');
                    } else {
                        els.healthDisplay.classList.remove('health-blink');
                    }

                    // Play engine-warning2 while health is between 20% and 0%
                    if (vehicleState.engineOn && percentage < 20) {
                        queueAudio(els.audio.engineWarning2, '--engine-volume');
                    }
                }
            }
        }
    };

    window.setSeatbelts = (isBuckled) => {
        if (vehicleState.isMotorcycle) {
            manageLoopingAudio(els.audio.alarm, false);
            return;
        }

        const isWearingBelt = !!isBuckled;
        vehicleState.seatbeltBuckled = isWearingBelt; // Store seatbelt state

        // Update old icon-based seatbelt if it exists
        toggleIcon('seatbelt', isWearingBelt);

        // Update new PNG-based seatbelt indicator
        if (els.seatbeltIndicator) {
            els.seatbeltIndicator.classList.remove('active', 'warning');

            if (!vehicleState.engineOn) {
                // Engine off: default dim state (handled by CSS)
            } else {
                // Engine on: full opacity (force override any CSS animations)
                if (isWearingBelt) {
                    // Buckled: green
                    els.seatbeltIndicator.classList.add('active');
                } else {
                    // Not buckled: red flashing
                    els.seatbeltIndicator.classList.add('warning');
                }
            }
        }

        const shouldPlayAlarm = !isWearingBelt && vehicleState.engineOn;
        manageLoopingAudio(els.audio.alarm, shouldPlayAlarm);

        // Play seatbelt warning audio when unbuckled and engine on
        const shouldPlaySeatbeltWarning = !isWearingBelt && vehicleState.engineOn && !vehicleState.isMotorcycle;
        manageSeatbeltAudio(shouldPlaySeatbeltWarning);
    };

    window.setEngine = (on) => {
        const newState = !!on;
        if (vehicleState.engineOn === newState) return;

        vehicleState.engineOn = newState;
        toggleIcon('engine', vehicleState.engineOn);

        // Update turn signal, headlight, and seatbelt engine state
        if (els.leftSignal && els.rightSignal) {
            els.leftSignal.classList.toggle('engine-on', newState);
            els.rightSignal.classList.toggle('engine-on', newState);
        }

        if (els.headlightContainer) {
            els.headlightContainer.classList.toggle('engine-on', newState);
        }

        if (els.seatbeltContainer) {
            els.seatbeltContainer.classList.toggle('engine-on', newState);
        }

        // Refresh seatbelt state when engine changes
        if (els.seatbeltIndicator) {
            // Get current seatbelt state or default to unbuckled
            const currentSeatbeltState = vehicleState.seatbeltBuckled !== undefined ? vehicleState.seatbeltBuckled : false;
            window.setSeatbelts(currentSeatbeltState);
        }

        if (!newState) {
            vehicleState.hasMoved = false;
            window.setGear('N');
            manageLoopingAudio(els.audio.alarm, false);

            // Reset all warning flags when engine turns off
            vehicleState.engineWarning50Played = false;
            vehicleState.engineWarning20Played = false;
            vehicleState.fuelWarning50Played = false;
            vehicleState.fuelWarning10Played = false;

            // Update fuel and health displays when engine turns off
            window.setFuel(vehicleState.fuelLevel / 100);
            window.setHealth(vehicleState.healthLevel / 100);
        } else {
            window.setGear(0);
            // Update fuel and health displays when engine turns on
            window.setFuel(vehicleState.fuelLevel / 100);
            window.setHealth(vehicleState.healthLevel / 100);

            // If motorcycle, ensure alarm doesn't sound
            if (vehicleState.isMotorcycle) {
                manageLoopingAudio(els.audio.alarm, false);
                return;
            }

            const isSeatbeltIconActive =
                els.icons.seatbelt && els.icons.seatbelt.classList.contains('active');
            if (!isSeatbeltIconActive) {
                manageLoopingAudio(els.audio.alarm, true);
            }
        }

        // Update speed color when engine state changes
        const currentSpeed = els.speed ? parseInt(els.speed.textContent) || 0 : 0;
        window.setSpeed(currentSpeed / 2.23694); // Convert back to original units for color update
    };

    window.setHeadlights = (level) => {
        // Update old icon-based lights if they exist
        const lights = els.icons.lights;
        if (lights) {
            lights.classList.remove('low-beam', 'high-beam');
            if (level === 1) lights.classList.add('low-beam');
            else if (level === 2) lights.classList.add('high-beam');
        }

        // Update new PNG-based headlights
        if (els.lowBeam && els.highBeam) {
            els.lowBeam.classList.remove('active');
            els.highBeam.classList.remove('active');

            if (level === 1) {
                // Low beam on, high beam transparent
                els.lowBeam.classList.add('active');
            } else if (level === 2) {
                // High beam on, low beam transparent
                els.highBeam.classList.add('active');
            }
            // If level === 0, both remain transparent (off)
        }
    };

    const updateIndicators = () => {
        // Update old icon-based indicators if they exist
        if (els.icons.left && els.icons.right) {
            const leftActive = els.icons.left.classList.contains('active');
            const rightActive = els.icons.right.classList.contains('active');

            els.icons.left.classList.remove('is-blinking');
            els.icons.right.classList.remove('is-blinking');

            if (leftActive && rightActive) {
                els.icons.left.classList.add('is-blinking');
                els.icons.right.classList.add('is-blinking');
            } else if (leftActive) {
                els.icons.left.classList.add('is-blinking');
            } else if (rightActive) {
                els.icons.right.classList.add('is-blinking');
            }

            manageLoopingAudio(els.audio.tick, leftActive || rightActive);
        }

        // Update new PNG-based turn signals
        if (els.leftSignal && els.rightSignal) {
            const leftActive = els.leftSignal.classList.contains('active');
            const rightActive = els.rightSignal.classList.contains('active');

            els.leftSignal.classList.remove('is-blinking');
            els.rightSignal.classList.remove('is-blinking');

            if (leftActive && rightActive) {
                els.leftSignal.classList.add('is-blinking');
                els.rightSignal.classList.add('is-blinking');
            } else if (leftActive) {
                els.leftSignal.classList.add('is-blinking');
            } else if (rightActive) {
                els.rightSignal.classList.add('is-blinking');
            }
        }
    };

    window.setLeftIndicator = (on) => {
        // Update old icon if it exists
        toggleIcon('left', on);

        // Update new PNG-based turn signal
        if (els.leftSignal) {
            els.leftSignal.classList.toggle('active', !!on);
        }

        updateIndicators();
    };

    window.setRightIndicator = (on) => {
        // Update old icon if it exists
        toggleIcon('right', on);

        // Update new PNG-based turn signal
        if (els.rightSignal) {
            els.rightSignal.classList.toggle('active', !!on);
        }

        updateIndicators();
    };

    // Initialize fuel, health, and seatbelt displays
    window.setFuel(1.0); // Start at 100%
    window.setHealth(1.0); // Start at 100%
    window.setSeatbelts(false); // Start unbuckled
});