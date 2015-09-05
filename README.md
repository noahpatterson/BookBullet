#Chrome Bookmarks To Pushbullet

![bookbullet logo](https://raw.githubusercontent.com/noahpatterson/BookBullet/master/icon48.png)

##About
This extension is a prototype that allows chrome users to push Chrome bookmarks into [Pushbullet](https://www.pushbullet.com) using the Pushbullet API.

###Why I built this
This tool was built to test use cases for Pushbullet but to also learn how to build chrome extensions.

##How it works
1. Install extension [(see below)](https://github.com/noahpatterson/BookBullet#how-to-install)

![view in chrome://extensions](https://raw.githubusercontent.com/noahpatterson/BookBullet/master/readme-images/view-in-extensions.png?raw=true)

2. Bookbullet uses Pushbullet's login url which sets a cookie.

![extension login link](https://raw.githubusercontent.com/noahpatterson/BookBullet/master/readme-images/extension-log-in-link.png?raw=true)
![pushbullet login](https://raw.githubusercontent.com/noahpatterson/BookBullet/master/readme-images/pushbullet-login.png?raw=true)

3. Bookbullet is then able to read that cookie to get the proper credentials to push to Pushbullet.

4. Bookbullet then reads Chrome's bookmarks and allows you to select the bookmarks to send to Pushbullet. Upon sending, we mark and store the sent flag locally. Sent flags will remain until manually cleared or the indexedDB database is destroyed.

![bookbullet ui](https://raw.githubusercontent.com/noahpatterson/BookBullet/master/readme-images/bookbullet-ui.png?raw=true)

5. Bookbullet also lets you clear sent bookmarks.

##How to install
1. Download root folder
2. Go to [chrome://extensions](chrome://extensions)
3. Turn on 'Developer mode'
4. Click 'Load unpacked extension' and select the downloaded root folder

![install bookbullet](https://raw.githubusercontent.com/noahpatterson/BookBullet/master/readme-images/bookbullet-install.png?raw=true)

##Technology
+ jQuery
+ indexedDB
+ Chrome extensions API

##Help, forking, questions, issues.
If you want to use it, use it.

If you want to ask me questions or submit new features: open an issue.

If you have improvements: open an issue and submit a pull request.

##License
The MIT License (MIT)

Copyright (c) 2015 Noah Patterson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
