function getPushbulletAPIKey() {
  chrome.cookies.get({'url': 'https://www.pushbullet.com/', 'name': 'api_key' }, function(cookie) {
    if (cookie) {
      var a = document.getElementsByTagName('a')[0];
      a.text = "Go to Bookmarks";
      a.href = "options.html";
    }
  });
}

document.addEventListener('DOMContentLoaded', getPushbulletAPIKey);
