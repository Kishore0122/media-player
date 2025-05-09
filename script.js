console.log("Music Player Initialized");

let currentSong = new Audio();
let songs = [];
let currFolder = "";
let albums = [];
let currentAlbumIndex = 0;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

async function getSongs(folder) {
  try {
    currFolder = folder;

    // For local development - hardcoded songs if fetching fails
    const defaultSongs = ["song1.mp3", "song2.mp3", "song3.mp3"];

    let fetchedSongs = [];

    try {
      // Try to fetch directory listing first
      console.log("Fetching songs from:", folder);
      const response = await fetch(folder);

      if (response.ok) {
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

        const as = div.getElementsByTagName("a");
        fetchedSongs = Array.from(as)
          .filter((a) => a.href.endsWith(".mp3"))
          .map((a) => {
            const url = new URL(a.href);
            return decodeURIComponent(url.pathname.split("/").pop());
          });

        console.log("Successfully fetched songs:", fetchedSongs);
      } else {
        console.warn(
          `Directory listing failed with status: ${response.status}. Using fallback.`
        );
      }
    } catch (fetchError) {
      console.warn("Error fetching directory listing:", fetchError);
    }

    // Use fetched songs or fall back to hardcoded list
    songs = fetchedSongs.length > 0 ? fetchedSongs : defaultSongs;

    // Update UI
    const songUL = document.querySelector(".songList ul");
    if (!songUL) {
      console.error("Song list container not found in the DOM");
      return songs;
    }

    songUL.innerHTML = "";
    for (const song of songs) {
      const title =
        song
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

    Array.from(songUL.getElementsByTagName("li")).forEach((e, i) => {
      e.addEventListener("click", () => playMusic(songs[i]));
    });

    return songs;
  } catch (error) {
    console.error("Error in getSongs function:", error);
    return [];
  }
}

function playMusic(track, pause = false) {
  try {
    // Construct proper song path
    let songPath;

    if (track.includes("://")) {
      // Track is already a full URL
      songPath = track;
    } else {
      // Need to build the URL
      const basePath = currFolder.endsWith("/") ? currFolder : `${currFolder}/`;
      songPath = `${basePath}${track}`;
    }

    console.log("Playing song:", songPath);

    currentSong.src = songPath;

    const title =
      track
        .replace(/\[.*?-/, "")
        .replace(".mp3", "")
        .trim()
        .split(" ")
        .slice(0, 3)
        .join(" ") || "Unknown Title";

    document.querySelector(".songinfo").innerHTML = title;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    currentSong.onerror = (e) => {
      console.error("Audio error:", e);
      alert(
        `Failed to load audio: ${track}. Check if the file exists at ${songPath}`
      );
    };

    if (!pause) {
      const playPromise = currentSong.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            document.getElementById("play").src = "src/pause.svg";
          })
          .catch((err) => {
            console.error("Error playing song:", err);
            if (err.name !== "AbortError") {
              alert("Failed to play the song. Check console for details.");
            }
          });
      }
    }
  } catch (error) {
    console.error("Error in playMusic function:", error);
  }
}

async function displayAlbums() {
  try {
    // Default albums if fetching fails

    let fetchedAlbums = [];
    const cardContainer = document.querySelector(".cardContainer");

    if (!cardContainer) {
      console.error("Card container not found in the DOM");
      return;
    }

    cardContainer.innerHTML = "";
    albums = [];

    try {
      // Try to fetch directory listing
      const response = await fetch("./songs/");

      if (response.ok) {
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

        const anchors = div.getElementsByTagName("a");

        for (const a of anchors) {
          const href = a.href;
          if (href.includes("/songs/") && !href.includes(".htaccess")) {
            const url = new URL(href);
            const pathParts = url.pathname.split("/").filter(Boolean);

            if (pathParts.length >= 2) {
              const folder = pathParts[pathParts.length - 1];
              fetchedAlbums.push({ folder });
            }
          }
        }

        // Try to get album info for each fetched folder
        for (let album of fetchedAlbums) {
          try {
            const infoResponse = await fetch(
              `./songs/${album.folder}/info.json`
            );
            if (infoResponse.ok) {
              const albumInfo = await infoResponse.json();
              album.title = albumInfo.title;
              album.description = albumInfo.description;
            }
          } catch (infoError) {
            album.title = album.folder;
            album.description = "Music collection";
          }
        }
      } else {
        console.warn(
          `Album directory listing failed with status: ${response.status}. Using default albums.`
        );
      }
    } catch (fetchError) {
      console.warn("Error fetching albums:", fetchError);
    }

    // Use fetched albums or fall back to defaults
    const albumsToDisplay =
      fetchedAlbums.length > 0 ? fetchedAlbums : defaultAlbums;

    // Process albums and create UI
    for (const album of albumsToDisplay) {
      albums.push(album.folder);

      cardContainer.innerHTML += `
                <div data-folder="${album.folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <img src="./songs/${
                      album.folder
                    }/cover.jpg" onerror="this.src='src/default-cover.jpg'" alt="Album Cover">
                    <h2>${album.title || album.folder}</h2>
                    <p>${album.description || "Music collection"}</p>
                </div>`;
    }

    // Set default album
    currentAlbumIndex = albums.indexOf("ncs");
    if (currentAlbumIndex === -1 && albums.length > 0) currentAlbumIndex = 0;

    // Add click event listeners to album cards
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", async () => {
        const folderPath = `./songs/${card.dataset.folder}`;
        console.log("Loading songs from folder:", folderPath);
        currentAlbumIndex = albums.indexOf(card.dataset.folder);
        songs = await getSongs(folderPath);
        if (songs.length > 0) playMusic(songs[0]);
      });
    });
  } catch (error) {
    console.error("Error in displayAlbums function:", error);
  }
}

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
    await getSongs("./songs/ncs");

    if (songs.length > 0) {
      playMusic(songs[0], true);
    }

    // Play/Pause button functionality
    playButton.addEventListener("click", () => {
      if (currentSong.paused) {
        const playPromise = currentSong.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              playButton.src = "src/pause.svg";
            })
            .catch((err) => {
              console.error("Play button click error:", err);
              if (err.name !== "AbortError") {
                alert("Failed to play audio. Make sure audio files exist.");
              }
            });
        }
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
      const remaining = secondsToMinutesSeconds(duration - currentTime);
      document.querySelector(
        ".songtime"
      ).innerHTML = `${current} / ${remaining}`;

      const percentPlayed = (currentTime / duration) * 100 || 0;
      document.querySelector(".circle").style.left = `${percentPlayed}%`;
    });

    // Seekbar functionality
    document.querySelector(".seekbar").addEventListener("click", (e) => {
      const seekbar = e.target;
      const percent = (e.offsetX / seekbar.getBoundingClientRect().width) * 100;
      document.querySelector(".circle").style.left = `${percent}%`;
      currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Mobile menu handlers
    document.querySelector(".hamburger").addEventListener("click", () => {
      document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
      document.querySelector(".left").style.left = "-120%";
    });

    // Previous song functionality
    previousButton.addEventListener("click", () => {
      try {
        const current = currentSong.src.split("/").pop();
        const decodedCurrent = decodeURIComponent(current);
        const index = songs.indexOf(decodedCurrent);

        if (index > 0) {
          playMusic(songs[index - 1]);
        } else if (index === 0 && currentAlbumIndex > 0) {
          currentAlbumIndex--;
          const prevAlbum = albums[currentAlbumIndex];
          getSongs(`./songs/${prevAlbum}`).then((fetchedSongs) => {
            if (fetchedSongs.length > 0) {
              playMusic(fetchedSongs[fetchedSongs.length - 1]);
            }
          });
        }
      } catch (error) {
        console.error("Error in previous button handler:", error);
      }
    });

    // Next song functionality
    nextButton.addEventListener("click", () => {
      try {
        const current = currentSong.src.split("/").pop();
        const decodedCurrent = decodeURIComponent(current);
        const index = songs.indexOf(decodedCurrent);

        if (index < songs.length - 1) {
          playMusic(songs[index + 1]);
        } else if (
          index === songs.length - 1 &&
          currentAlbumIndex < albums.length - 1
        ) {
          currentAlbumIndex++;
          const nextAlbum = albums[currentAlbumIndex];
          getSongs(`./songs/${nextAlbum}`).then((fetchedSongs) => {
            if (fetchedSongs.length > 0) {
              playMusic(fetchedSongs[0]);
            }
          });
        }
      } catch (error) {
        console.error("Error in next button handler:", error);
      }
    });

    // Volume slider functionality
    volumeSlider.addEventListener("input", (e) => {
      const volume = parseInt(e.target.value) / 100;
      currentSong.volume = volume;
      document.querySelector(".volume>img").src =
        volume > 0 ? "src/volume.svg" : "src/mute.svg";
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

    // Handle song ended event
    currentSong.addEventListener("ended", () => {
      try {
        const current = currentSong.src.split("/").pop();
        const decodedCurrent = decodeURIComponent(current);
        const index = songs.indexOf(decodedCurrent);

        if (index < songs.length - 1) {
          playMusic(songs[index + 1]);
        } else if (currentAlbumIndex < albums.length - 1) {
          currentAlbumIndex++;
          const nextAlbum = albums[currentAlbumIndex];
          getSongs(`./songs/${nextAlbum}`).then((fetchedSongs) => {
            if (fetchedSongs.length > 0) {
              playMusic(fetchedSongs[0]);
            }
          });
        }
      } catch (error) {
        console.error("Error in song ended handler:", error);
      }
    });
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

document.addEventListener("DOMContentLoaded", main);
