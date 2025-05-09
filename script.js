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
        console.log("Fetching songs from:", `/${folder}/`);
        const response = await fetch(`/${folder}/`);
        if (!response.ok) throw new Error(`Failed to fetch songs from ${folder}: ${response.status}`);
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

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
            return [];
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
                        <div style="padding: 10px 0; ">Practice Purpose Only</div>
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

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

/**
 * Plays a music track
 * @param {string} track - Track filename
 * @param {boolean} pause - Whether to start paused
 */
function playMusic(track, pause = false) {
    try {
        const songPath = `/${currFolder}/${track}`;
        console.log("Playing song:", songPath);
        
        currentSong.src = songPath;

        const title = track
            .replace(/\[.*?-/, "")
            .replace(".mp3", "")
            .trim()
            .split(" ")
            .slice(0, 3)
            .join(" ") || "Unknown Title";
      
        document.querySelector(".songinfo").innerHTML = title;
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

        // Add error event listener
        currentSong.onerror = (e) => {
            console.error("Audio error:", e);
            alert(`Failed to load audio: ${track}`);
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
        const response = await fetch(`/songs/`);
        if (!response.ok) throw new Error(`Failed to fetch albums: ${response.status}`);
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
                    const folder = pathParts[1]; // Get the folder name after "songs"
                    albums.push(folder); // Store folder
                    
                    try {
                        const albumResponse = await fetch(`/songs/${folder}/info.json`);
                        if (!albumResponse.ok) throw new Error(`Failed to fetch album info for ${folder}`);
                        const albumInfo = await albumResponse.json();

                        cardContainer.innerHTML += `
                            <div data-folder="${folder}" class="card">
                                <div class="play">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <img src="/songs/${folder}/cover.jpg" alt="Album Cover">
                                <h2>${albumInfo.title}</h2>
                                <p>${albumInfo.description}</p>
                            </div>`;
                    } catch (error) {
                        console.error(`Error loading info for folder ${folder}:`, error);
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
    }
}

/**
 * Main function to initialize the music player
 */
async function main() {
    try {
        const playButton = document.getElementById("play");
        const previousButton = document.getElementById("previous");
        const nextButton = document.getElementById("next");
        const volumeSlider = document.querySelector(".range input");

        if (!playButton || !previousButton || !nextButton || !volumeSlider) {
            console.error("One or more controls not found in the DOM");
            return;
        }

        await displayAlbums();
        await getSongs("songs/ncs");
        if (songs.length > 0) playMusic(songs[0], true);

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
            const currentTime = currentSong.currentTime;
            const duration = currentSong.duration || 0;
            const current = secondsToMinutesSeconds(currentTime);
            const total = secondsToMinutesSeconds(duration);
            const remaining = secondsToMinutesSeconds(duration - currentTime);
            document.querySelector(".songtime").innerHTML = `${current} /${remaining}`;
            document.querySelector(".circle").style.left = 
                ((currentSong.currentTime / currentSong.duration) * 100 || 0) + "%";
        });

        // Seekbar click handling
        document.querySelector(".seekbar").addEventListener("click", e => {
            const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        });

        // Mobile menu handlers
        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

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
        volumeSlider.addEventListener("input", (e) => {
            const volume = parseInt(e.target.value) / 100;
            currentSong.volume = volume;
            document.querySelector(".volume>img").src = volume > 0 ? "src/volume.svg" : "src/mute.svg";
        });

        // Volume icon click handler
        document.querySelector(".volume>img").addEventListener("click", (e) => {
            const icon = e.target;
            if (icon.src.includes("mute.svg")) {
                icon.src = "src/volume.svg";
                currentSong.volume = 0.1;
                volumeSlider.value = 10;
            } else {
                icon.src = "src/mute.svg";
                currentSong.volume = 0;
                volumeSlider.value = 0;
            }
        });
        
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