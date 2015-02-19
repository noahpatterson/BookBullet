
function getPushbulletAPIKey() {
  chrome.cookies.get({'url': 'https://www.pushbullet.com/', 'name': 'api_key' }, function(cookie) {
    storeAPIKey(cookie['value']);
  });
}

function storeAPIKey(key) {
  chrome.storage.local.set({
    api_key: key
  }, checkPushbulletSignin(key));
}

function getFolders(tree) {
  // var folders = [];
  // $children.each(function(folder){
  //   folders.push({'id' : folder["id"], "title" : folder["title"]});
  // });
  // return folders;
  return $.map(tree[0].children, function(folder) { return folder })
}

function showContents(folder) {

}

function applyAlreadySent(container) {
  $(container).find('a').addClass('sent-item');
  $(container).append("<span class='sent'>SENT!</span");
}

function listItems(folder, container) {
  if (folder.children) {
    $.each(folder.children, function(index, folderContents) {
      if (folderContents.children) {
        // var p = $("<p></p>").text("folder! " + folderContents.title);
        // container.append(p);
        var folderLink = $("<h2></h2>").text(folderContents.title);
        var folderDiv = $('<ul class="folder hidden items"><ul>').append(folderLink);
        container.append(folderDiv);
        listItems(folderContents, folderDiv);
      } else {
        var link = $('<a></a>').attr('href', folderContents.url).text(folderContents.title).attr('target', '_blank');



        var input = $('<input></input>').attr('data-url', folderContents.url).attr('type', 'checkbox');
        var wrapper = $('<span class="item_wrapper"></span>').append(input).append(link);

        var result = '';
        findBookmarkUrl(DB_STORE_NAME, folderContents.url, wrapper);


        var p = $("<li class='hidden items'></li>").append(wrapper);
        container.append(p);


      }
    });
    // var folderLink = $("<a></a>").attr('href', '#').text(folder.title);
    // var folderDiv = $('<div class="folder"><div>').append(folderLink);
  } else {
    container.append("<p></p>").text(folder.title);
  }
}

function processBookmarks() {
  var mainTree;
  chrome.bookmarks.getTree(function(tree) {
    mainTree = tree;
    $.each(getFolders(mainTree), function(index, folder){
      console.log(folder);
      var folderLink = $("<h2></h2>").text(folder.title);
      var folderDiv = $('<ul class="folder rootFolder"><ul>').append(folderLink);
      listItems(folder, folderDiv);
      $('#folders').append(folderDiv);


    });
    $('.rootFolder').click(function() {
      $('.rootFolder').not(this).children('.items').addClass('hidden');
    });
    $('.folder').click('ul', function(e){
        e.stopPropagation();
        var h2 = $(this).children('h2');
        if(e.target != this && e.target != h2[0]) return;
        $(this).children('.items').toggleClass('hidden');
      });
  });

  // for folder in folders {
  //   var folderLink = document.createElement("A");
  //   folderLink.href = '#';
  //   folderLink.text = folder["text"];
  //   document.getElementById('folders').appendChild(folderLink);
  // }
}

function checkPushbulletSignin(api_key) {
  var signin_link = document.getElementById('pushbullet_signin');
  var clickSigninListener = function(e){
      e.preventDefault();
      console.log('event listener clicked');
      chrome.cookies.remove({'url': 'https://www.pushbullet.com/', 'name' : 'api_key' });
      storeAPIKey(undefined);
    };
  if (api_key) {
    signin_link.href = '';
    signin_link.text = 'Sign Out';
    signin_link.addEventListener('click',clickSigninListener, false );
    processBookmarks();
  } else {
    signin_link.href = 'https://www.pushbullet.com/signin';
    signin_link.text = 'Pushbullet Sign In';
    document.getElementById('pushbullet_signin').removeEventListener('click', clickSigninListener, false);
  }
}

var getHeaders = function(key) {
  return {
    // 'X-User-Agent': pb.userAgent,
    'API-Version': '2014-05-07',
    'Authorization': 'Bearer ' + key.api_key,
    'Accept': 'application/json'
  };
};

//indexedDB Storage of sent Bookmarks

const DB_NAME = 'SentBookmarks';
const DB_VERSION = 1;
const DB_STORE_NAME = 'bookmarks';

var db;

// Used to keep track of which view is displayed to avoid uselessly reloading it
var current_view_pub_key;

function openDb() {
  console.log("openDb ...");
  var req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onsuccess = function (evt) {
    // Better use "this" than "req" to get the result to avoid problems with
    // garbage collection.
    // db = req.result;
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
    // Don't forget to handle errors!
  };

  var objectStore = transaction.objectStore(storeName);
  objectStore.add(data);
}
function findBookmarkUrl(storeName, url, container) {
  container = container || undefined;
  var objectStore = db.transaction(storeName).objectStore(storeName);
  var index = objectStore.index("url");
  var request = index.get(url);
  request.onsuccess = function(event) {
    // alert("Donna's SSN is " + event.target.result.ssn);
    if (event.target.result) {
      console.log("the stored url is: " + event.target.result.url);
      if (container) {
        applyAlreadySent(container);
      }
      result = event.target.result.url;
    } else {
      console.log("couldn't find the entry");
      result = false;
    }
  };
}
// --END indexedDB


var post = function(url, object, done) {

    chrome.storage.local.get({
    api_key: ''
    }, function(api_key) {
      console.log('POST ' + url);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      var headers = getHeaders(api_key);
      Object.keys(headers).map(function(key) {
          xhr.setRequestHeader(key, headers[key]);
      });

      xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            $(':checked').next('a').each(function(index, value) {
              $(value).addClass('sent-item');
              $(value).parent().append("<span class='sent'>SENT!</span");
              $(value).closest('input').attr('checked', false);

              //storing data
              var result;
              findBookmarkUrl(DB_STORE_NAME, object.url, undefined);
              if (result) {
                console.log('bookmark already stored');
              } else {
                addData(DB_STORE_NAME, { url: object.url });
              }
            });
              console.log("status: " + xhr.status + " response: " + xhr.responseText);
              // onResponse(xhr.status, xhr.responseText, done);
          }
      };

      xhr.send(JSON.stringify(object));

    });
};

function selectedBookmarks() {
  console.log('in select');
  var bookmarks = $(':checked').next('a');
  return $.map(bookmarks, function(bookmark) {
    $bookmark = $(bookmark);
    return { url: $bookmark.attr('href'), title: $bookmark.text() };
  });
}

function sendBookmarks(bookmarks) {
  console.log('in send');
  console.log(bookmarks);
  $.each(bookmarks, function(index, bookmark) {
    bookmark.type = 'link';
    bookmark.body = 'Bookmark sent from Chrome';
    post('https://api.pushbullet.com/v2/pushes', bookmark , undefined);
  });
}

document.addEventListener('DOMContentLoaded', getPushbulletAPIKey);
$(function() {
  openDb();
  $('#sendBookmarks').click(function() {
    console.log('clicked');
    sendBookmarks(selectedBookmarks());
  });
  $('#clearSentBookmarks').click(function() {
    console.log('clearing bookmarks indexedDB');
    clearObjectStore(DB_STORE_NAME);
  })
});

