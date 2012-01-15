SABdrop
=======

SABdrop is a Google Chrome extension that permits sending links of
[NZB](http://en.wikipedia.org/wiki/NZB) files to a [SABnzbd](http://sabnzbd.org/)
instance immediately. It adds a `Send to` option to the context menu of weblinks.

Additionally it scans websites for linked NZB files and - when files are found - 
adds a page action to the address bar of Chrome that offers transmission of
those files to SABnzbd.

SABdrop has been tested with SABnzbd version 0.6.0 but should run with 0.5.x, too.

Features
--------

* Context menu to send NZB weblinks to SABnzbd for immediate download
* Page action in address bar that scans for NZB weblinks
* Supports API key and username/password authentication
* Supports categories (NZB links can be assigned to a category with context menu)
* Allows sending NZB files as file upload which should work around issues with sites that require an authentication (e.g. forums)
* Specification of alternative NZB names for sites with ugly download URLs

Configuration
-------------

These are the settings found on the options page of SABdrop:

### SABnzbd host

This is the full address of a SABnzbd instance including the protocol and
**optionally** port. Some examples:

    http://localhost/sabnzbd
    http://localhost:8080/
    http://192.168.80.1:8080/

Note that `/api` **must not** be appended to the URL.

### Authentication method

Type of authentication method of SABnzbd instance. This is either `API key` or 
`Username/password`. `API key` is the preferred method. `Username/password`
should only be used if `API key` doesn't work for some reason. Note that a SABnzbd
instance only supports one method at a time. If uncertain please check your SABnzbd
configuration.

### API key

The API key is required to access SABnzbd's API when `API key` has been selected as
`Authentication method`. It can be found in the configuration of SABnzbd's web
interface. If no API key exists one must be created.

### Username

Username for `Username/password` authentication method. This doesn't need to be
filled out if `API key` is used.

### Password

Password for `Username/password` authentication method. This doesn't need to be
filled out if `API key` is used.

### Advanced options

These settings are hidden beneath the "Advanced options" tab:

#### Define NZB names

Usually SABdrop tries to extract the name of NZB downloads from the download
URL. This works well for sites with pretty URLs (e.g. 
`www.somesite.com/downloads/somedownload.nzb`) but fails for websites with ugly
URLs (`.../download.php?id=1337`). If this setting is set to `always` SABdrop
displays a notification dialog where the name of the NZB can be altered for every
download. If set to `never` SABdrop will not display the dialog and always take parts
from the URL for the name.

Please note that the notification dialog automatically disappears after 10 seconds
and the download starts if there wasn't any interaction with the dialog. If the
dialog is closed by the user (by clicking the "x") the download is aborted.

#### Use file upload

The default behavior of SABdrop is to send the weblink of a NZB file to SABnzbd.
If this options is enabled SABdrop will instead download the NZB file locally and
then send that file to SABnzbd. This may work around issues with sites that require
an authentication (e.g. forums).

This is an **experimental** feature and has not been tested thoroughly. It may not
work as expected.

#### Hide categories

By default SABdrop requests the categories that have been set up on SABnzbd and
adds them to the context menu. This enables sending a link to SABnzbd while adding
it to a category at the same time. If this is not desired categories can be disabled
with this setting. All downloads will be added to the standard category then.

#### Hide popup after

SABdrop displays a non-obstrusive popup explaining the status of the current 
action. This settings specifies the milliseconds after the popup shall disappear.
If this setting is `0` popups will be disabled completely.

#### Match patterns

A list of [regular expressions](http://en.wikipedia.org/wiki/Regular_expression)
that are applied to the `href` attribute of page elements. If one of these
expressions match, the href is considered a link to a NZB and is displayed in the
page action (address bar). Each regular expression is separated by a newline.
If you are not familiar with regular expressions please don't change this option.
It may break SABdrops behavior.
