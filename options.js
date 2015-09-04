//indexedDB Storage of sent Bookmarks

const DB_NAME = 'SentBookmarks';
const DB_VERSION = 1;
const DB_STORE_NAME = 'bookmarks';

var db;

function openDb() {
  console.log("openDb ...");
  var req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onsuccess = function (evt) {
    db = this.result;
    console.log("openDb DONE");
  };
  req.onerror = function (evt) {
    console.error("openDb:", evt.target.errorCode);
  };
  req.onupgradeneeded = function (evt) {
    console.log("openDb.onupgradeneeded");
    var store = evt.currentTarget.result.createObjectStore(
      DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
    store.createIndex('url', 'url', { unique: true });
  };
}

function getObjectStore(store_name, mode) {
    var tx = db.transaction(store_name, mode);
    return tx.objectStore(store_name);
  }

function clearObjectStore(store_name) {
  var store = getObjectStore(DB_STORE_NAME, 'readwrite');
  var req = store.clear();
  req.onsuccess = function(evt) {
    console.log("Store cleared");
    window.location.reload(true);
  };
  req.onerror = function (evt) {
    console.error("clearObjectStore:", evt.target.errorCode);
  };
}

function addData(storeName, data) {
  var transaction = db.transaction([storeName], "readwrite");
  transaction.oncomplete = function(event) {
    console.log("store done");
  };
  transaction.onerror = function(event) {
    console.log("there was an error storing data");
  };
  var objectStore = transaction.objectStore(storeName);
  objectStore.add(data);
}

var loginState = { logged_in: false };

function getFolders(tree) {
  return $.map(tree[0].children, function(folder) { return folder })
}

function applyAlreadySent(container) {
  $(container).find('a').addClass('sent-item');
  $(container).append("<span class='sent'>SENT!</span");
}

// TODO: refactor deeply nested if
function listItems(folder, container) {
  if (folder.children) {
    $.each(folder.children, function(index, folderContents) {
      if (folderContents.children) {
        var folderLink = $("<h2></h2>").text(folderContents.title);
        var folderDiv = $('<ul class="folder hidden items"><ul>').append(folderLink);
        container.append(folderDiv);
        listItems(folderContents, folderDiv);
      } else {
        var link = $('<a></a>').attr('href', folderContents.url).text(folderContents.title).attr('target', '_blank');

        if (loginState.logged_in === true) {
          var input = $('<input></input>').attr('data-url', folderContents.url).attr('type', 'checkbox');
          $(input).change(function() {
            if ($(':checked').length >= 5) {
              $('.alert').text("You can only send 5 bookmarks at a time.").removeClass('hidden');
              $('input').not(":checked").attr('disabled', true);
            } else if ($('input[disabled]').length > 0 ){
              $('input').not(":checked").removeAttr("disabled");
              $('.alert').addClass('hidden');
            }
          });
        }
        var wrapper = $('<span class="item_wrapper"></span>').append(input).append(link);

        findBookmarkUrl(DB_STORE_NAME, folderContents.url, wrapper);

        var p = $("<li class='hidden items'></li>").append(wrapper);
        container.append(p);
      }
    });
  } else {
    container.append("<p></p>").text(folder.title);
  }
}

function getPushbulletAPIKey() {
  chrome.cookies.get({'url': 'https://www.pushbullet.com/', 'name': 'api_key' }, function(cookie) {
    if (cookie) {
      loginState.logged_in = true;
      storeAPIKey(cookie['value']);
    } else {
      processBookmarks();
    }
  });
}

function storeAPIKey(key) {
  chrome.storage.local.set({
    api_key: key
  }, checkPushbulletSignin(key));
}

function checkPushbulletSignin(api_key) {
  var signin_link = document.getElementById('pushbullet_signin');
  var clickSigninListener = function(e){
      e.preventDefault();
      chrome.cookies.remove({'url': 'https://www.pushbullet.com/', 'name' : 'api_key' });
      storeAPIKey("");
      loginState.logged_in = false;
      window.location.reload(true);
    };
  if (api_key) {
    signin_link.href = '';
    signin_link.text = 'Sign Out';
    $(signin_link).addClass('signOut');
    $('#logInOut span').addClass('hidden');
    $('#sendBookmarks').removeClass('hidden').addClass('shown');
    signin_link.addEventListener('click',clickSigninListener, false );
    processBookmarks();
  } else {
    signin_link.href = 'https://www.pushbullet.com/signin';
    signin_link.text = 'Pushbullet Sign In';
    $('#logInOut span').removeClass('hidden');
    $(signin_link).removeClass('signOut');
    $('#sendBookmarks').addClass('hidden');
    document.getElementById('pushbullet_signin').removeEventListener('click', clickSigninListener, false);
  }
}

function processBookmarks() {
  chrome.bookmarks.getTree(function(tree) {
    var rootFolderDivContainer = $("<div></div>");
    $.each(getFolders(tree), function(index, folder){
      var folderLink = $("<h2></h2>").text(folder.title);
      var folderDiv = $('<ul class="folder rootFolder"><ul>').append(folderLink);
      listItems(folder, folderDiv);
      rootFolderDivContainer.append(folderDiv);
    });
    $('#folders').append(rootFolderDivContainer);
    $('.folder').click('ul', function(e){
        e.stopPropagation();
        var h2 = $(this).children('h2');
        if(e.target != this && e.target != h2[0]) return;
        $(this).children('.items').toggleClass('hidden');
      });
  });
}

var getHeaders = function(key) {
  return {
    'API-Version': '2014-05-07',
    'Authorization': 'Bearer ' + key.api_key,
    'Accept': 'application/json'
  };
};

function findBookmarkUrl(storeName, url, container) {
  container = container || undefined;
  var objectStore = db.transaction(storeName).objectStore(storeName);
  var index = objectStore.index("url");
  var request = index.get(url);
  request.onsuccess = function(event) {
    if (event.target.result) {
      if (container) {
        applyAlreadySent(container);
      }
      return event.target.result.url;
    } else {
      console.log("couldn't find the entry");
      return false;
    }
  };
}

function storeBookmarkUrl(storeName, url) {
  var objectStore = db.transaction(storeName).objectStore(storeName);
  var index = objectStore.index("url");
  var request = index.get(url);
  request.onsuccess = function(event) {
    if (event.target.result) {
      console.log('bookmark already stored');
    } else {
      addData(DB_STORE_NAME, { url: url });
    }
  };
}

var post = function(url, object, done) {
    chrome.storage.local.get({
      api_key: ''
    }, function(api_key) {
      var xhr = new XMLHttpRequest();
      var bookmark = object.bookmark;
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      var headers = getHeaders(api_key);
      Object.keys(headers).map(function(key) {
          xhr.setRequestHeader(key, headers[key]);
      });

      xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            $('.sendingAlert').removeClass('sendingAlertShow').addClass('hidden');

            if (!bookmark.hasClass('sent-item')) {
              bookmark.addClass('sent-item');
              bookmark.parent().append("<span class='sent'>SENT!</span");
            }
            bookmark.prev('input').attr('checked', false);

            //storing data
            storeBookmarkUrl(DB_STORE_NAME, object.url);

            console.log("status: " + xhr.status + " response: " + xhr.responseText);
          } else if (xhr.readyState === 4 && xhr.status !== 200) {
            var response = JSON.parse(xhr.response);
            $('.sendingAlert').removeClass('sendingAlertShow').addClass('hidden');
            $('.alert').text("Unable to send to pushbullet: ").removeClass('hidden').append($("<strong>" +  response.error.message + "</strong>"));
          }
      };
      xhr.onerror = function(event) {
        var errorText = xhr.statusText || "Looks like you might be offline."
        $('.sendingAlert').removeClass('sendingAlertShow').addClass('hidden');
        $('.alert').text("Unable to send to pushbullet: ").removeClass('hidden').append($("<strong>" +  errorText + "</strong>"));
      };
      object.bookmark = '';
      xhr.send(JSON.stringify(object));

    });
};

function selectedBookmarks() {
  var bookmarks = $(':checked').next('a');
  return $.map(bookmarks, function(bookmark) {
    $bookmark = $(bookmark);
    return { url: $bookmark.attr('href'), title: $bookmark.text(), bookmark: $bookmark };
  });
}

function sendBookmarks(bookmarks) {
  $.each(bookmarks, function(index, bookmark) {
    bookmark.type = 'link';
    bookmark.body = 'Bookmark sent from Chrome';
    post('https://api.pushbullet.com/v2/pushes', bookmark , undefined);
  });
  $('input').removeAttr("disabled");
}

document.addEventListener('DOMContentLoaded', getPushbulletAPIKey);
$(function() {
  openDb();
  $('#sendBookmarks').click(function() {
    $('.alert').toggleClass('hidden');
    $('.sendingAlert').removeClass('hidden').addClass('sendingAlertShow');
    var bookmarks = selectedBookmarks();
    if (bookmarks.length > 0) {
      sendBookmarks(bookmarks);
    } else {
      $('.sendingAlert').removeClass('sendingAlertShow').addClass('hidden');
      $('.alert').text("Unable to send to pushbullet: ").removeClass('hidden').append($("<strong>" +  "You didn't select any bookmarks!" + "</strong>"));
    }
  });
  $('#clearSentBookmarks').click(function() {
    clearObjectStore(DB_STORE_NAME);
  })
});

