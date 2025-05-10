console.log('Let\'s write JavaScript');

// Global variables
let currentSong = new Audio();
let songs = [];
let currFolder = '';
let albums = [];
let currentAlbumIndex = 0;

/**
 * Converts seconds to MM:SS format
 * @param {number} seconds - Seconds to convert
 * @return {string} Time in MM:SS format
 */
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Fetches songs from specified folder and displays them
 * @param {string} folder - Path to the folder containing songs
 * @return {Array} List of songs
 */
async function getSongs(folder) {
    currFolder = folder;
    try {
        // Fix for hosted environments - ensure we have a consistent path format
        const folderPath = folder.endsWith('/') ? folder : folder + '/';
        console.log("Fetching songs from:", folderPath);
        
        const response = await fetch(folderPath);
        if (!response.ok) {
            console.error(`Failed to fetch songs from ${folderPath}: ${response.status}`);
            // Try with alternative path format
            const altPath = folder.startsWith('/') ? folder.substring(1) : '/' + folder;
            console.log("Trying alternative path:", altPath);
            const altResponse = await fetch(altPath);
            if (!altResponse.ok) {
                console.error(`Also failed with alternative path: ${altResponse.status}`);
                return [];
            }
            const text = await altResponse.text();
            const div = document.createElement("div");
            div.innerHTML = text;
            processSongsList(div);
            return songs;
        }
        
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;
        processSongsList(div);
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
    
    // Helper function to process songs list
    function processSongsList(div) {
        const as = div.getElementsByTagName("a");
        songs = Array.from(as)
            .filter(a => a.href.endsWith(".mp3"))
            .map(a => {
                // Extract just the filename from the URL
                const url = new URL(a.href);
                return decodeURIComponent(url.pathname.split('/').pop());
            });

        console.log("Fetched songs:", songs);

        const songUL = document.querySelector(".songList ul");
        if (!songUL) {
            console.error("Song list container not found in the DOM");
            return;
        }

        songUL.innerHTML = "";
        for (const song of songs) {
            const title = song
                .replace(/\[.*?-/, "")
                .replace(".mp3", "")
                .trim()
                .split(" ")
                .slice(0, 3)
                .join(" ") || "Unknown Title";
          
            songUL.innerHTML += `
                <li>
                    <img class="invert" width="34" src="src/music.svg" alt="Music Icon">
                    <div class="info">
                        <div>${title}</div>
                        <div>Kishore</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="src/play.svg" alt="Play Icon">
                    </div>
                </li>`;
        }

        // Add click listeners to song list items
        Array.from(songUL.getElementsByTagName("li")).forEach((e, i) => {
            e.addEventListener("click", () => playMusic(songs[i]));
        });
    }
}

/**
 * Plays a music track
 * @param {string} track - Track filename
 * @param {boolean} pause - Whether to start paused
 */
function playMusic(track, pause = false) {
    try {
        // Fix for path issues in different environments
        let songPath;
        
        // If currFolder starts with a slash but not with http/https, handle differently
        if (currFolder.startsWith('/') && !currFolder.startsWith('http')) {
            songPath = `${currFolder}${currFolder.endsWith('/') ? '' : '/'}${track}`;
        } else {
            // For relative paths or full URLs
            songPath = `${currFolder}${currFolder.endsWith('/') ? '' : '/'}${track}`;
        }
        
        console.log("Playing song:", songPath);
        
        currentSong.src = songPath;

        const title = track
            .replace(/\[.*?-/, "")
            .replace(".mp3", "")
            .trim()
            .split(" ")
            .slice(0, 3)
            .join(" ") || "Unknown Title";
      
        const songinfoElement = document.querySelector(".songinfo");
        if (songinfoElement) {
            songinfoElement.innerHTML = title;
        }
        
        const songtimeElement = document.querySelector(".songtime");
        if (songtimeElement) {
            songtimeElement.innerHTML = "00:00 / 00:00";
        }

        // Add error event listener
        currentSong.onerror = (e) => {
            console.error("Audio error:", e);
            console.log("Trying alternative path format");
            
            // Try alternative path format
            if (songPath.startsWith('/')) {
                currentSong.src = songPath.substring(1); // Remove leading slash
            } else {
                currentSong.src = '/' + songPath; // Add leading slash
            }
            
            // Set up a new error handler for the retry
            currentSong.onerror = (e2) => {
                console.error("Audio error on retry:", e2);
                alert(`Failed to load audio: ${track}`);
            };
            
            if (!pause) currentSong.play().catch(err => console.error("Retry play error:", err));
        };

        if (!pause) {
            currentSong.play()
                .then(() => {
                    document.getElementById("play").src = "src/pause.svg";
                })
                .catch(err => {
                    console.error("Error playing song:", err);
                    alert("Failed to play the song. Check console for details.");
                });
        }
    } catch (error) {
        console.error("Error in playMusic function:", error);
    }
}

/**
 * Fetches and displays album cards
 */
async function displayAlbums() {
    try {
        // Try both with and without leading slash
        let response;
        try {
            response = await fetch('/songs/');
            if (!response.ok) throw new Error("Failed with /songs/");
        } catch (error) {
            console.log("Trying alternative path for albums");
            response = await fetch('songs/');
            if (!response.ok) {
                console.error("Failed to fetch albums with both path formats");
                return;
            }
        }
        
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

        const anchors = div.getElementsByTagName("a");
        const cardContainer = document.querySelector(".cardContainer");
        if (!cardContainer) {
            console.error("Card container not found in the DOM");
            return;
        }
        cardContainer.innerHTML = "";
        
        // Clear albums array before adding new ones
        albums = [];
        
        for (const a of anchors) {
            const href = a.href;
            // Extract folder names from paths
            if (href.includes("/songs/") && !href.includes(".htaccess")) {
                const url = new URL(href);
                const pathParts = url.pathname.split('/').filter(Boolean);
                if (pathParts.length >= 2) {
                    const folder = pathParts[pathParts.length - 1]; // Get the last part of the path
                    
                    // Avoid duplicates
                    if (!albums.includes(folder)) {
                        albums.push(folder); // Store folder
                        
                        try {
                            // Try with leading slash
                            let albumPath = `/songs/${folder}/info.json`;
                            let albumResponse = await fetch(albumPath);
                            
                            // If that fails, try without leading slash
                            if (!albumResponse.ok) {
                                albumPath = `songs/${folder}/info.json`;
                                albumResponse = await fetch(albumPath);
                            }
                            
                            if (!albumResponse.ok) {
                                console.warn(`No info.json found for ${folder}, using default values`);
                                // Create card with default values
                                cardContainer.innerHTML += `
                                    <div data-folder="${folder}" class="card">
                                        <div class="play">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                        <img src="songs/${folder}/cover.jpg" alt="Album Cover" onerror="this.src='src/default-cover.jpg'">
                                        <h2>${folder}</h2>
                                        <p>Album description</p>
                                    </div>`;
                            } else {
                                const albumInfo = await albumResponse.json();
                                cardContainer.innerHTML += `
                                    <div data-folder="${folder}" class="card">
                                        <div class="play">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                        <img src="songs/${folder}/cover.jpg" alt="Album Cover" onerror="this.src='src/default-cover.jpg'">
                                        <h2>${albumInfo.title || folder}</h2>
                                        <p>${albumInfo.description || 'Album description'}</p>
                                    </div>`;
                            }
                        } catch (error) {
                            console.error(`Error loading info for folder ${folder}:`, error);
                            // Provide fallback
                            cardContainer.innerHTML += `
                                <div data-folder="${folder}" class="card">
                                    <div class="play">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <img src="songs/${folder}/cover.jpg" alt="Album Cover" onerror="this.src='src/default-cover.jpg'">
                                    <h2>${folder}</h2>
                                    <p>Album description</p>
                                </div>`;
                        }
                    }
                }
            }
        }

        // Set currentAlbumIndex to the "ncs" album if it exists
        currentAlbumIndex = albums.indexOf("ncs");
        if (currentAlbumIndex === -1) currentAlbumIndex = 0;

        // Add click listeners to album cards
        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                const folderPath = `songs/${card.dataset.folder}`;
                console.log("Loading songs from folder:", folderPath);
                currentAlbumIndex = albums.indexOf(card.dataset.folder);
                songs = await getSongs(folderPath);
                if (songs.length > 0) playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
        // Fallback - try to load songs directly if albums fail
        await getSongs("songs/ncs");
    }
}

/**
 * Main function to initialize the music player
 */
async function main() {
    try {
        console.log("Initializing music player");
        
        // Check if we're on localhost or hosted
        const isLocalhost = window.location.hostname === "localhost" || 
                           window.location.hostname === "127.0.0.1" ||
                           window.location.hostname === "";
        console.log("Environment:", isLocalhost ? "localhost" : "hosted");
        
        const playButton = document.getElementById("play");
        const previousButton = document.getElementById("previous");
        const nextButton = document.getElementById("next");
        const volumeSlider = document.querySelector(".range input");

        if (!playButton || !previousButton || !nextButton || !volumeSlider) {
            console.error("One or more controls not found in the DOM");
            return;
        }

        await displayAlbums();
        
        try {
            await getSongs("songs/ncs");
            if (songs.length > 0) playMusic(songs[0], true);
        } catch (e) {
            console.error("Error loading initial songs:", e);
            // Try without the leading slash
            try {
                await getSongs("songs/ncs");
                if (songs.length > 0) playMusic(songs[0], true);
            } catch (e2) {
                console.error("Both attempts to load initial songs failed:", e2);
            }
        }

        // Play/Pause button functionality
        playButton.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play().then(() => {
                    playButton.src = "src/pause.svg";
                }).catch(err => {
                    console.error("Play button click error:", err);
                });
            } else {
                currentSong.pause();
                playButton.src = "src/play.svg";
            }
        });

        // Update time and seekbar
        currentSong.addEventListener("timeupdate", () => {
            const current = secondsToMinutesSeconds(currentSong.currentTime);
            const total = secondsToMinutesSeconds(currentSong.duration || 0);
            
            const songtimeElement = document.querySelector(".songtime");
            if (songtimeElement) {
                songtimeElement.innerHTML = `${current} / ${total}`;
            }
            
            const circleElement = document.querySelector(".circle");
            if (circleElement) {
                circleElement.style.left = ((currentSong.currentTime / currentSong.duration) * 100 || 0) + "%";
            }
        });

        // Seekbar click handling
        const seekbar = document.querySelector(".seekbar");
        if (seekbar) {
            seekbar.addEventListener("click", e => {
                const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
                const circle = document.querySelector(".circle");
                if (circle) {
                    circle.style.left = percent + "%";
                }
                currentSong.currentTime = ((currentSong.duration) * percent) / 100;
            });
        } else {
            console.warn("Seekbar element not found");
        }

        // Mobile menu handlers
        const hamburger = document.querySelector(".hamburger");
        if (hamburger) {
            hamburger.addEventListener("click", () => {
                const left = document.querySelector(".left");
                if (left) left.style.left = "0";
            });
        } else {
            console.warn("Hamburger menu button not found");
        }

        const closeBtn = document.querySelector(".close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                const left = document.querySelector(".left");
                if (left) left.style.left = "-120%";
            });
        } else {
            console.warn("Close button not found");
        }

        // Previous button functionality
        previousButton.addEventListener("click", () => {
            const current = currentSong.src.split("/").pop();
            const decodedCurrent = decodeURIComponent(current);
            const index = songs.indexOf(decodedCurrent);
            console.log("Previous clicked:", {current, decodedCurrent, index, songs});
            if (index > 0) {
                playMusic(songs[index - 1]);
            } else if (index === 0 && currentAlbumIndex > 0) {
                // Go to previous album's last song
                currentAlbumIndex--;
                const prevAlbum = albums[currentAlbumIndex];
                getSongs(`songs/${prevAlbum}`).then(fetchedSongs => {
                    if (fetchedSongs.length > 0) {
                        playMusic(fetchedSongs[fetchedSongs.length - 1]);
                    }
                });
            }
        });

        // Next button functionality
        nextButton.addEventListener("click", () => {
            const current = currentSong.src.split("/").pop();
            const decodedCurrent = decodeURIComponent(current);
            const index = songs.indexOf(decodedCurrent);
            console.log("Next clicked:", {current, decodedCurrent, index, songs});
            if (index < songs.length - 1) {
                playMusic(songs[index + 1]);
            } else if (index === songs.length - 1 && currentAlbumIndex < albums.length - 1) {
                // Go to next album's first song
                currentAlbumIndex++;
                const nextAlbum = albums[currentAlbumIndex];
                getSongs(`songs/${nextAlbum}`).then(fetchedSongs => {
                    if (fetchedSongs.length > 0) {
                        playMusic(fetchedSongs[0]);
                    }
                });
            }
        });

        // Volume slider functionality
        if (volumeSlider) {
            volumeSlider.addEventListener("input", (e) => {
                const volume = parseInt(e.target.value) / 100;
                currentSong.volume = volume;
                const volumeIcon = document.querySelector(".volume>img");
                if (volumeIcon) {
                    volumeIcon.src = volume > 0 ? "src/volume.svg" : "src/mute.svg";
                }
            });
        }

        // Volume icon click handler
        const volumeIcon = document.querySelector(".volume>img");
        if (volumeIcon) {
            volumeIcon.addEventListener("click", (e) => {
                const icon = e.target;
                if (icon.src.includes("mute.svg")) {
                    icon.src = "src/volume.svg";
                    currentSong.volume = 0.1;
                    if (volumeSlider) volumeSlider.value = 10;
                } else {
                    icon.src = "src/mute.svg";
                    currentSong.volume = 0;
                    if (volumeSlider) volumeSlider.value = 0;
                }
            });
        } else {
            console.warn("Volume icon not found");
        }
        
        // Song ended event - play next song or move to next album
        currentSong.addEventListener("ended", () => {
            const current = currentSong.src.split("/").pop();
            const decodedCurrent = decodeURIComponent(current);
            const index = songs.indexOf(decodedCurrent);
        
            if (index < songs.length - 1) {
                // Play next song in current album
                playMusic(songs[index + 1]);
            } else {
                // Last song in current album, move to next album
                if (currentAlbumIndex < albums.length - 1) {
                    currentAlbumIndex++;
                    const nextAlbum = albums[currentAlbumIndex];
                    getSongs(`songs/${nextAlbum}`).then(fetchedSongs => {
                        if (fetchedSongs.length > 0) {
                            playMusic(fetchedSongs[0]);
                        }
                    });
                } else {
                    console.log("All albums and songs finished.");
                }
            }
        });
        
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', main);
