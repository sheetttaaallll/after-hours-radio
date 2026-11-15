const fileInput = document.getElementById("file-input");
const songList = document.getElementById("song-list");
const audio = document.getElementById("audio");
const title = document.getElementById("song-title");
const artist = document.getElementById("song-artist");
const billuFrame = document.getElementById("billu-frame");

let songs = [];
let currentIndex = -1;

// OPEN PERMANENT MUSIC STORAGE
const request = indexedDB.open("AfterHoursRadio", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("music", {
    keyPath: "id",
    autoIncrement: true
  });
};

request.onsuccess = async function (event) {
  const db = event.target.result;

  const transaction = db.transaction("music", "readonly");
  const store = transaction.objectStore("music");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    songs = getAll.result.map(song => ({
      id: song.id,
      name: song.name,
      url: URL.createObjectURL(song.blob)
    }));

    renderSongs();
  };
};

request.onerror = function () {
  alert("Music storage could not be opened. Please try another browser.");
};

// SAVE NEW MUSIC PERMANENTLY
fileInput.addEventListener("change", function () {
  const files = Array.from(this.files);
  const db = request.result;

  if (!db) {
    alert("Music storage is not ready yet. Please try again.");
    this.value = "";
    return;
  }

  const transaction = db.transaction("music", "readwrite");
  const store = transaction.objectStore("music");

  files.forEach(file => {
    if (!file.type.startsWith("audio/")) return;

    const name = file.name.replace(/\.[^/.]+$/, "");

    store.add({
      name: name,
      blob: file
    });
  });

  transaction.oncomplete = function () {
    loadMusic(db);
  };

  transaction.onerror = function () {
    alert("Some songs could not be saved. Check your available storage.");
  };

  this.value = "";
});

// LOAD SAVED MUSIC
function loadMusic(db) {
  const transaction = db.transaction("music", "readonly");
  const store = transaction.objectStore("music");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    songs.forEach(song => URL.revokeObjectURL(song.url));

    songs = getAll.result.map(song => ({
      id: song.id,
      name: song.name,
      url: URL.createObjectURL(song.blob)
    }));

    renderSongs();
  };
}

// DISPLAY SONGS
function renderSongs() {
  songList.innerHTML = "";

  if (songs.length === 0) {
    songList.innerHTML =
      '<p class="empty">NO TRACKS YET. ADD SOME MUSIC.</p>';
    return;
  }

  songs.forEach((song, index) => {
    const item = document.createElement("div");
    item.className = "song";

    const left = document.createElement("div");

    const number = document.createElement("span");
    number.className = "song-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const name = document.createElement("span");
    name.className = "song-name";
    name.textContent = song.name;

    left.append(number, name);

    const play = document.createElement("span");
    play.className = "song-play";
    play.textContent = currentIndex === index ? "♫" : "▶";

    item.append(left, play);

    item.addEventListener("click", () => {
      playSong(index);
    });

    songList.appendChild(item);
  });
}

// PLAY SONG
function playSong(index) {
  if (index < 0 || index >= songs.length) return;

  currentIndex = index;
  audio.src = songs[index].url;

  title.textContent = songs[index].name;
  artist.textContent = "FROM YOUR PERSONAL ARCHIVE ✳";

  renderSongs();

  audio.play().catch(() => {
    artist.textContent = "PRESS PLAY TO START LISTENING.";
  });
}

// BILLU ANIMATION
audio.addEventListener("play", () => {
  billuFrame.classList.add("playing");
});

audio.addEventListener("pause", () => {
  billuFrame.classList.remove("playing");
});

audio.addEventListener("ended", () => {
  billuFrame.classList.remove("playing");

  if (currentIndex < songs.length - 1) {
    playSong(currentIndex + 1);
  }
});