SAPdrop
=======

SAPdrop is a Google Chrome extension that permits sending links of
[NZB](http://en.wikipedia.org/wiki/NZB) files to a [SABnzbd](http://sabnzbd.org/)
instance immediately. It adds a `Send to` option to the context menu of weblinks.

Additionally it scans websites for linked NZB files and - when files are found - 
adds a page action to the address bar of Chrome that offers transmission of
those files to SABnzbd.

SABdrop has been tested with SABnzbd version 0.6.0.

Configuration
-------------

The options page of SABdrop offers three settings. These are:

### SABnzbd host

This is the full address to a SABnzbd instance including the protocol and
**optionally** the port. Some examples:

    http://localhost/sabnzbd
    http://localhost:8080/
    http://192.168.80.1:8080/

Note that `/api` **must not** be appended to the URL.

### API key

The API key is required to access SABnzbd's API. It can be found in the
configuration of SABnzbd's web interface. If no API key exists one must be created.

### Hide popup after

SABdrop displays a non-obstrusive popup explaining the status of the current 
action. This settings specifies the milliseconds after the popup shall disappear.
If this setting is `0` popups will be disabled completely.
