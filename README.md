# Summarize it

Chrome extension to summarize, extract sentiments and topics from any website.

Powered by modzy.com API.

![logo](./chrome-extension/anonymizer-extension/images/icon-128.png "Logo")

This project has been created for the modzy hackathon (<https://modzyai.devpost.com/>).


## Instructions to testing:


As the extension is not published in the store, we are going to add it manually in your Google Chrome browser. These steps are only necessary the first time.

Note: a Chrome Extension performs modifications and calculations on the current browser tab (this extension will anonymize the tab so as not to show private information in your streams, in addition to other functionalities).

1. Download the source code of my extension, it is on github: <https://github.com/javichur/modzy-chrome-extension>. Save it for example in "c:\temp\summarize-it\" (sample for Windows users).

2. Type the following address in your Google Chrome browser: <chrome://extensions/>

3. In the upper right corner of Chrome, select the "Developer Mode" checkbox. A new button will appear called "Load unpacked" on left, press it.

4. A dialog box appears to choose the folder on your computer that contains the source code of the Chrome extension. "Select the path: c:\temp\summarize-it\chrome-extension\

5. Ready! In the "Extensions" section of Chrome you will see this new extension (upper right corner of your browser). I recommend that you click on "pin" so that the extension appears to the right of the browser's address bar.

6. When clicking on the extension icon, the extension popup will be displayed. You can configure your own Modzy API KEY. Don't worry, I have prepared the extension to explain you how to do it.

7. Finally, I recommend you use the "Summary" functionality, for example on the Jordan page: <https://simple.wikipedia.org/wiki/Michael_Jordan>. If you want more data to be hidden, you can add more types of entities in the configuration section of the extension. You can also try the "sentiments" functionality, for example in this tab: <https://en.wikipedia.org/wiki/Happiness>.