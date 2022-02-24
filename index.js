const API = {
  ID_URL: "https://id.twitch.tv",
  API_URL: "https://api.twitch.tv/helix",
  CLIENT_ID: "9i9mh1ek6y3pgjlzlak227hrqfv8mo",
  CLIENT_SECRET: "zf88g07jv72p3qodnx3r12ry7zjf6j",
  ACCESS_TOKEN: "k40z150d0hoz9cwvklrbxs8ovjga4v",
};

const SIDEBAR_TEMPLATE = `
  <div class="sidebar">
    <h3 class="sidebar-title">Top Games</h3>
    <ul class="menu"></ul>
  </div>
`;

let currentCursor = "";

// img 180*240
const CARD_TEMPLATE = `
  <div class="card">
    <a href="$url">
      <img class="thumbnail" src="$thumbnail" />
      <div class="card-streamer">
        <div class="avatar"></div>
        <div class="info">
          <h3 class="streamer-title">$title</h3>
          <h4 class="streamer-name">$name</h4>
        </div>
      </div>
    </a>
  </div>
`;

const SEARCH_CARD_TEMPLATE = `
  <div class="search-card">
    <a href="$url" class="card-streamer">
      <img src="$thumbnail" class="avatar" />
      <div class="info">
        <h3 class="streamer-title">$title</h3>
        <h4 class="streamer-name">$name</h4>
      </div>
    </a>
  </div>
`;

// test Access Token validation
test();

function test() {
  $.ajax({
    type: "GET",
    url: `${API.ID_URL}/oauth2/validate`,
    headers: {
      Authorization: `Bearer ${API.ACCESS_TOKEN}`,
    },
    success: function (resp) {
      console.log("success!");
      getTopGames();
    },
    error: function (err) {
      console.log("test Error: \n");

      const response = err.responseJSON;
      for (let value in response) {
        console.log(`${value}: ${response[value]}`);
      }
      getToken();
    },
  });
}

// Generate token
function getToken() {
  $.ajax({
    type: "POST",
    url: `${API.ID_URL}/oauth2/token?client_id=${API.CLIENT_ID}&client_secret=${API.CLIENT_SECRET}&grant_type=client_credentials`,
    success: function (resp) {
      API.ACCESS_TOKEN = resp.access_token;
      test();
    },
    error: function (err) {
      console.log("getToken Error: \n");

      const response = err.responseJSON;
      for (let value in response) {
        console.log(`${value}: ${response[value]}`);
      }
    },
  });
}

// 每次都發新的 token
// 檢查是否過期、過期重發就好
// expires_in

// get top 20 games
function getTopGames() {
  $.ajax({
    type: "GET",
    url: `${API.API_URL}/games/top?first=20`,
    headers: {
      Authorization: `Bearer ${API.ACCESS_TOKEN}`,
      "Client-Id": API.CLIENT_ID,
    },
    success: function (topGames) {
      const games = topGames.data;
      addSidebar(games);
      replaceTitle(games[0].id, games[0].name);
      getTopStreams(games[0].id);
    },
    error: function (err) {
      console.log("getTopGames Error: \n");

      const response = err.responseJSON;
      for (let value in response) {
        console.log(`${value}: ${response[value]}`);
      }
    },
  });
}

// get top 20 games' streams
function getTopStreams(gameId) {
  $.ajax({
    type: "GET",
    url: `${API.API_URL}/streams?game_id=${gameId}&first=20`,
    headers: {
      Authorization: `Bearer ${API.ACCESS_TOKEN}`,
      "Client-Id": API.CLIENT_ID,
    },
    success: function (resp) {
      const streams = resp.data;
      currentCursor = resp.pagination.cursor;
      for (let stream of streams) {
        replaceCard(stream);
      }
      $(".load-btn").text("Load more...");
    },
    error: function (err) {
      console.log("getTopGames Error: \n");

      const response = err.responseJSON;
      for (let value in response) {
        console.log(`${value}: ${response[value]}`);
      }
    },
  });
}

function search(searchQuery) {
  $(".cards").empty().addClass("search-cards");
  $(".btn").attr("id", "search");
  replaceTitle("", searchQuery);
  getSearchChennals(searchQuery);
}

function getSearchChennals(searchQuery) {
  $.ajax({
    type: "GET",
    url: `${API.API_URL}/search/channels?query=${searchQuery}`,
    headers: {
      Authorization: `Bearer ${API.ACCESS_TOKEN}`,
      "Client-Id": API.CLIENT_ID,
    },
    success: function (resp) {
      const channels = resp.data;
      currentCursor = resp.pagination.cursor;
      for (let channel of channels) {
        replaceSearchCard(channel);
      }
    },
    error: function (err) {
      console.log("getTopGames Error: \n");

      const response = err.responseJSON;
      for (let value in response) {
        console.log(`${value}: ${response[value]}`);
      }
    },
  });
}

// 拿到 gameId, cursor
function getTopGamesLoadMore(gameId, cursor) {
  $.ajax({
    type: "GET",
    url: `${API.API_URL}/streams?game_id=${gameId}&after=${cursor}`,
    headers: {
      Authorization: `Bearer ${API.ACCESS_TOKEN}`,
      "Client-Id": API.CLIENT_ID,
    },
    success: function (resp) {
      const streams = resp.data;
      for (let stream of streams) {
        replaceCard(stream);
      }
      currentCursor = resp.pagination.cursor;
    },
    error: function (err) {
      console.log("getTopGames Error: \n");

      const response = err.responseJSON;
      for (let value in response) {
        console.log(`${value}: ${response[value]}`);
      }
    },
  });
}

// 2022.02.09 先做 search channels 的 load more
function getChannelsLoadMore(searchQuery, cursor) {
  $.ajax({
    type: "GET",
    url: `${API.API_URL}/search/channels?query=${searchQuery}&after=${cursor}`,
    headers: {
      Authorization: `Bearer ${API.ACCESS_TOKEN}`,
      "Client-Id": API.CLIENT_ID,
    },
    success: function (resp) {
      const streams = resp.data;
      for (let stream of streams) {
        replaceSearchCard(stream);
      }
      currentCursor = resp.pagination.cursor;
    },
    error: function (err) {
      console.log("getChannels Error: \n");

      const response = err.responseJSON;
      for (let value in response) {
        console.log(`${value}: ${response[value]}`);
      }
    },
  });
}

// add sidebar content
function addSidebar(topGames) {
  $("aside").html(SIDEBAR_TEMPLATE);
  topGames.map((game) => {
    const list = $.parseHTML(
      `<li data-id="${game.id}">${escapeHtml(`${game.name}`)}</li>`
    );
    $(".menu").append(list);
  });
}

function replaceTitle(gameId, gameName) {
  if (gameId) {
    $(".wrapper-title h1").text(gameName).attr("id", gameId);
    $(".wrapper-title h3").text(`Top 20 streams of ${gameName}`);
  } else {
    $(".wrapper-title h1").text("Channels").attr("id", escapeHtml(gameName));
    $(".wrapper-title h3").text(`search results for ${gameName}`);
  }
}

// card content, handle object stream
function replaceCard(stream) {
  const thumbnail = stream.thumbnail_url.replace("{width}x{height}", "360x200");
  const card = CARD_TEMPLATE.replace("$thumbnail", thumbnail)
    .replace("$url", `https://www.twitch.tv/${stream.user_login}`)
    .replace("$title", stream.title)
    .replace("$name", stream.user_name);
  $(".cards").append(card);
}

function replaceSearchCard(stream) {
  const card = SEARCH_CARD_TEMPLATE.replace("$thumbnail", stream.thumbnail_url)
    .replace("$url", `https://www.twitch.tv/${stream.broadcaster_login}`)
    .replace("$title", stream.title)
    .replace("$name", stream.display_name);
  $(".cards-wrapper .search-cards").append(card);
}

// click navbar to change sidebar content
$("nav").on("click", "ul .categories", (e) => {
  location.reload();
});

// click sidebar to change cards' content
$("aside").on("click", ".menu li", (e) => {
  let gameId = e.target.getAttribute("data-id");
  let gameName = e.target.innerText;
  $(".cards").html("").removeClass("search-cards");
  $(".btn").attr("id", "");
  replaceTitle(gameId, gameName);
  getTopStreams(gameId);
});

// search by clicking search & enter
$(".search-btn").click(() => {
  const inputValue = $(".search-input").val();
  if (!inputValue.trim()) return;
  search(escapeHtml(inputValue));
  // 2022.01.28 顯示搜尋結果頻道/分類
});

$(".search-input").keydown((e) => {
  if (e.which == 13) {
    const inputValue = $(".search-input").val();
    if (!inputValue.trim()) return;
    search(escapeHtml(inputValue));
    // 2022.01.28 顯示搜尋結果頻道/分類
  }
});

// click load more button to show more results
$(".btn").click((e) => {
  let isSearch = e.target.id === "search" ? true : false;
  const gameId = $(".top").attr("id");
  if (isSearch) {
    getChannelsLoadMore(gameId, currentCursor);
  } else {
    getTopGamesLoadMore(gameId, currentCursor);
  }
});

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
