Camdroid panels 
## Introduction
Version: 1.3.5
Description
BAS-IP Camdroid panels API specification

The following document outlines every API route available for the next models of BAS-IP Linux based individual outdoor panels, multiapartment outdoor panels, and access controllers:

Panels with only one direct call button, without display, and with camera:
av-01bd
av-01d
av-01ed
av-01md
av-01mfd
av-02d
av-03bd
av-03d
av-04fd
av-04sd
av-04sdi
av-04fdi
av-04fdip
av-05fd
av-05sd
Panels with only one direct call button, without display, and with keyboard:
av-01kd
av-01kbd
Panels with only one direct call button, without display, and without camera:
av-02fdr
av-02fde
av-02ide
av-02idr
av-02ipd
av-04afd
av-04afdi
av-04asd
Panels with a few direct call buttons and without display:
ba-04bd
ba-04md
ba-08bd
ba-08md
ba-12bd
ba-12md
Panels with keyboard, 4 inch display, 2 MP camera, and without face recognition features:
aa-07bd
Controllers and readers:
cr-02bd
Authentication
Bearer Auth
Basic Auth
Security Scheme Type:	http
HTTP Authorization Scheme:	bearer
Bearer format:	
Contact
dev@bas-ip.com
License
Apache 2.0

====================================
auth >
status >
network >
device >
apartment >
access >
forward >
advanced >
log >
security >
system >
admin >
camera >
multiapartment >
individual >
link >
feature >
integration >
control4 >
====================================

# auth
    get Logs user into the system                         ← NEED DETAILS — how we authenticate to call the device API (Bearer token or Basic Auth; needed before any push/pull call below)
    get Logs out the current session
# status
    Get device summary information                        ← NICE TO HAVE — health check; could alert us if the device goes offline
    Get current system language
    Set system language
    Get current SIP registration status
    Get current SIP registration status
    Get device time
# network
    Get network settings
    Set static network settings
    Enable DHCP
    Get device MAC address
    Get NTP server address
    Set NTP server address
    Get DST settings
    Set Daylight Saving Time (DST) settings
    Get current timezone and list of available timezones
    Set device timezone
    Get management server settings
    Set management server settings
    Get management server settings
    Set management server settings
    Get info about using certificate for Link remote server MQTT protocol
    Upload certificate for Link remote server MQTT protocol
    Remove uploaded cetificate for MQTT Link server connection
    Get debug info about Link connection
    Get network capture data
    Start the capturing network packets
    Stop the capturing network packets
    Get network capture status
# device
    Get device time
    Sets the date, time and timezone on the device
    Get panel work mode
    Set panel work mode to `Apartment` mode
    Set panel work mode to `Unit` mode
    Set panel work mode to `Wall` mode
    Get information about Enabling/Disabling SIP
    Turns On/Off calls with SIP
    Get SIP Settings
    Set SIP Settings
    Get information about Enabling/Disabling SIP
    Turns On/Off calls with SIP
    Get SIP Settings
    Set SIP Settings
    Get SIP auto reregister settings
    Set SIP auto reregister settings
    Get SIP auto reregister settings
    Set SIP auto reregister settings
    Get auto answer settings
    Turn on/off auto answer
    Get concierge number settings
    Set concierge number settings
    Get dial timeout
    Set dial timeout
    Get talk timeout
    Set talk timeout
    Get end the call by pressing call button feature status
    Set end the call by pressing call button feature status
    Returns the call termination options when the lock is opened
    Sets the call termination options when the lock is opened
    Get auto dial feature settings
    Set auto dial feature settings
    Get camera video resolution
    Set camera video resolution
    Get payload codec information
    Set payload codec
    Get RTSP stream username/password
    Set RTSP stream username/password
    Get speaker volume level
    Set speaker volume level
    Get relay boot position
    Set relay boot position
    Get help station settings
    Customize help station feature
    Get the settings for rescuer service mode
    Set the settings for rescuer service mode
    Get the settings for dispatch service mode
    Set the settings for dispatch service mode
# apartment
    Create Apartment Entity
    Get Apartment Entity detailed information
    Update Apartment Entity information
    Delete Apartment Entity
    Attach identifier to apartment
    Detach identifier from apartment
    Get Apartments list
    Delete multiple apartment items
    Create/update multiple Apartment Entities with `link_id`
    Delete multiple Apartment Entities with link_id
    Get multiple Apartment Entities with `link_id`
# access
    Get relay unlock if SIP registration failed feature status and time for it
    Set relay unlock if SIP registration failed feature status and time for it
    Get master acces code
    Set master access code
    Get master card number
    Set master card number
    Get the type of lock used
    Set the type of lock used
    Get time after opening until locking                  ← NEED DETAILS — how long the lock stays open after granting access; we should know the current value and whether we can set it
    Set time after opening until locking                  ← NEED DETAILS — same as above
    Get delay before unlocking
    Set delay before unlocking
    Open lock via HTTP                                    ← NEED DETAILS — lets our server open the lock directly over the local network, bypassing the Remote Access Server flow; useful for admin override
    Get remote access server settings                     ← NEED DETAILS — so we can READ the current callback URL configuration from the device (useful for diagnostics)
    Set remote access server settings                     ← NEED DETAILS — so we can WRITE the callback URL programmatically instead of doing it manually through the device UI
    Open the lock from remote server                      ← ALREADY USING — this is what our API triggers by responding {"handled":true,"access":{"granted":true,"lock_number":1}}
    Deny access from remote server                        ← ALREADY USING — this is what our API triggers by responding {"handled":true,"access":{"granted":false}}
    Start emergency mode and open the locks               ← NICE TO HAVE — could expose a gym-side "emergency open" button for the owner
    Cancel emergency mode and close the locks             ← NICE TO HAVE — paired with the above
    Get external locks settings
    Get DTMF codes for door locks
    Set DTMF codes for door locks
    Get the floor number for lift module
    Set the floor number for lift module
    Get the lift settings
    Set the lift settings
    GET the list of EVRC-IP devices numbers that will process the commands from this panel
    POST the list of EVRC-IP devices numbers that will process the commands from this panel
    Clears the list of EVRC-IP devices numbers that will process the commands from this panel. If list is empty ALL EVRC-IP will process the command
    Get monitor security mode feature status
    Turn on/off monitor security mode
    Get Wiegand settings
    Setup Wiegand input/output
    Create Identifier Entity                              ← NEED DETAILS — push a member's RFID tag or QR code to the device's local list; this is how we sync
    Get png representation of the stored QR identifier   ← NEED DETAILS — the device can generate a QR image for an identifier we pushed; we could display this in the member profile
    Get Identifier Entity                                 ← NEED DETAILS — read back a single stored identifier
    Update Identifier Entity                              ← NEED DETAILS — update a stored identifier (e.g. if a member's card changes)
    Delete Identifier Entity                              ← NEED DETAILS — remove an identifier when a membership expires or a member is deactivated
    Attach time profile to identifier                     ← NEED DETAILS — restrict an identifier to specific hours (e.g. gym opening hours only); very relevant for membership validity windows
    Detach time profile from identifier                   ← NEED DETAILS — paired with the above
    Reset Identifier left passes to max                   ← NEED DETAILS — for session-based memberships (e.g. 12-visit plan); device can count passes remaining
    Get identifiers list                                  ← NEED DETAILS — audit what the device currently has stored; use this to detect drift from our member list
    Delete multiple Identifier items                      ← NEED DETAILS — bulk remove (e.g. purge all expired members in one call)
    Update multiple Identifier items by link_id           ← NEED DETAILS — THIS IS KEY: link_id is probably our member ID; lets us update by our ID without knowing the device's internal ID
    Delete multiple Identifier items by link_id           ← NEED DETAILS — same; remove by our member ID
    Get multiple Identifier items with link_id            ← NEED DETAILS — same; query by our member ID
    Create Time Profile Entity                            ← NEED DETAILS — define an access schedule (e.g. Mon–Sat 06:00–22:00); attach this to all member identifiers
    Get Time Profile Entity                               ← NEED DETAILS
    Update Time Profile Entity                            ← NEED DETAILS
    Delete Time Profile Entity                            ← NEED DETAILS
    Get Time Profiles list                                ← NEED DETAILS
    Delete multiple Time Profile items
    Create/Update multiple Time Profile items by link_id
    Delete multiple Time Profile items by link_id
    Get multiple Time Profile items with link_id
    Send data from camera about license plate number
    Get door sensor setings                               ← NICE TO HAVE — know if the door is physically open or closed
    Set door sensor settings
    Get current door sensor status                        ← NICE TO HAVE — same; useful for monitoring
    Gets the type of Wiegand used.
    Adjusts the type of Wiegand used.
    Status of the contacts of the exit button
    Set status of the contacts of the exit button
    Get the settings for all locks
    Set the settings for all locks
# forward
    Get call forward mode
    Set call forward mode
    Create/Update call forward rule
    Delete call forward rule for apartment
    Get call forward rules list
    Delete multiple call forward rules
    Create/Update multiple call forward rules with link_id
    Delete multiple call forward rules with link_id
    Get multiple call forward rules with link_id
# advanced
    Get RTSP feed feature streams
    Set RTSP feed feature streams
    Get custom open lock sound settings
    Enable/Disable custom lock open sound feature
    Set custom lock open sound
    Delete custom lock open sound
    Get custom ringing tone settings
    Enable/Disable custom ringing tone feature
    Set custom ringing tone sound
    Delete custom ringing tone sound
    Get custom incoming call ringtone settings
    Enable/Disable custom incoming call ringtone feature
    Set custom incoming call ringtone sound
    Delete custom incoming call ringtone sound
    Get custom start call sound settings
    Enable/Disable custom start call sound feature
    Set custom start call sound
    Delete custom start call sound
    Get custom conversation start sound settings
    Enable/Disable custom conversation start sound feature
    Set custom conversation start sound
    Delete custom conversation start sound
    Get start call sound state status
    Enable/Disable start call sound feature
    Get conversation start sound state status
    Enable/Disable conversation start sound feature
    Download custom sound
# log
    Get management server settings
    Set management server settings
    Get logs list                                         ← NEED DETAILS — pull the device's own access event log; useful to reconcile with our visit log or to detect events we missed
    Get list of events which can be used to trigger sending photo from camera to Link
    Set list of events which can be used to trigger sending photo from camera to Link
# security
    Configure tamper
    Get tamper settings
    Get the list of banned IPs
    Adds the given IPs to ban list
    Unban the given IP addresses
    Unban all IPs
    Get the list of allowed IPs
    Adds the given IP addresses to the whitelist           ← NICE TO HAVE — whitelist our server's IP so only we can call the device API
    Deletes the given IP addresses from the white list
    Clears the white list
    Change web interface Admin password
    Change GUI Admin password
# system
    Configure tamper
    Get tamper settings
    Reboot device
    Create general settings backup
    Restore device settings from file
    Reset device to factory settings
    Create users data backup
    Restore users data from backup
    Check firmware update
    Get custom firmware updates server settings
    Set custom firmware updates server settings
    Start upgrading firmware from server
    Upload firmware image and start update
    Make an outgoing call from device
    Get debug call status
    Stop debug call
    Removes table data, such as identifiers, apartments, access rules, forward rules, logs
    Get info about 'support remote connection' feature status
    Allow/refuse support team's remote connection to your device. (Connection will only be possible if you provide your device's serial number and credentials to the device)
# admin
    Get list of events which can be used to trigger sending photo from camera to Link
    Set list of events which can be used to trigger sending photo from camera to Link
    Get Apartment Entity detailed information
    Update Apartment Entity information
    Delete Apartment Entity
    Attach identifier to apartment
    Detach identifier from apartment
    Get Apartments list
    Delete multiple apartment items
    Create/update multiple Apartment Entities with `link_id`
    Delete multiple Apartment Entities with link_id
    Get multiple Apartment Entities with `link_id`
    Get relay unlock if SIP registration failed feature status and time for it
    Set relay unlock if SIP registration failed feature status and time for it
    Set SIP auto reregister settings
    Set SIP auto reregister settings
    Get master acces code
    Set master access code
    Get master card number
    Set master card number
    Get the type of lock used
    Set the type of lock used
    Get time after opening until locking
    Set time after opening until locking
    Get delay before unlocking
    Set delay before unlocking
    Open lock via HTTP
    Open the lock from remote server
    Deny access from remote server
    Start emergency mode and open the locks
    Cancel emergency mode and close the locks
    Get the floor number for lift module
    Set the floor number for lift module
    Get the lift settings
    Set the lift settings
    GET the list of EVRC-IP devices numbers that will process the commands from this panel
    POST the list of EVRC-IP devices numbers that will process the commands from this panel
    Clears the list of EVRC-IP devices numbers that will process the commands from this panel. If list is empty ALL EVRC-IP will process the command
    Get monitor security mode feature status
    Turn on/off monitor security mode
    Get Wiegand settings
    Setup Wiegand input/output
    Create Identifier Entity
    Get png representation of the stored QR identifier
    Get Identifier Entity
    Update Identifier Entity
    Delete Identifier Entity
    Attach time profile to identifier
    Detach time profile from identifier
    Reset Identifier left passes to max
    Get identifiers list
    Delete multiple Identifier items
    Update multiple Identifier items by link_id
    Delete multiple Identifier items by link_id
    Get multiple Identifier items with link_id
    Create Time Profile Entity
    Get Time Profile Entity
    Update Time Profile Entity
    Delete Time Profile Entity
    Get Time Profiles list
    Delete multiple Time Profile items
    Create/Update multiple Time Profile items by link_id
    Delete multiple Time Profile items by link_id
    Get multiple Time Profile items with link_id
    Change web interface Admin password
    Change GUI Admin password
    Gets the type of Wiegand used.
    Adjusts the type of Wiegand used.
# camera
    Get current camera mode
    Set camera mode
    Take snapshot from IP camera                          ← NICE TO HAVE — capture a photo at the moment of access; attach to visit record for security audit
    Gets the settings for turning on the backlight and switching to the BW mode
    Sets the settings for turning on the backlight and switching to the BW mode
# multiapartment
    Set auto dial feature settings
# individual
    Get end the call by pressing call button feature status
# link
    Get management server settings
    Set management server settings
    Get management server settings
    Set management server settings
    Get info about using certificate for Link remote server MQTT protocol
    Upload certificate for Link remote server MQTT protocol
    Remove uploaded cetificate for MQTT Link server connection
    Get debug info about Link connection
    Create/update multiple Apartment Entities with `link_id`
    Delete multiple Apartment Entities with link_id
    Get multiple Apartment Entities with `link_id`
    Update multiple Identifier items by link_id
    Delete multiple Identifier items by link_id
    Get multiple Identifier items with link_id
    Create/Update multiple Time Profile items by link_id
    Delete multiple Time Profile items by link_id
    Get multiple Time Profile items with link_id
    Create/Update multiple call forward rules with link_id
    Delete multiple call forward rules with link_id
    Get multiple call forward rules with link_id
# feature
    Get help station settings
    Customize help station feature
    Get the settings for rescuer service mode
    Set the settings for rescuer service mode
    Get the settings for dispatch service mode
    Set the settings for dispatch service mode
# integration
    Get the settings for integration with Control4
    Set the settings for integration with Control4
# control4
    Get the settings for integration with Control4
    Set the settings for integration with Control4
=======================================================

# get Logs user into the system
Camdroid panels>auth>Logs user into the system
Logs user into the system
Used to collect a Bearer token for a registered user

Query Parameters
    username string required
    The user name for login

    password string required
    MD5 hash of the password for login (e. g. 123456=E10ADC3949BA59ABBE56E057F20F883E)

    Responses
    200
    400
- OK

application/json
Schema
Example (from schema)
Example
Schema
token string
token in uuid format

account_type string
Possible values: [admin]

account role that affects permissions

GET /login
Request
Base URL
https://virtserver.swaggerhub.com/basip/linux-multiapartment-panel-api/1.3.5
username — query required
The user name for login
password — query required
MD5 hash of the password for login (e. g.  123456=E10ADC3949BA59ABBE56E057F20F883E)
const axios = require('axios');

let config = {
  method: 'get',
  url: 'https://virtserver.swaggerhub.com/basip/linux-multiapartment-panel-api/1.3.5/login',
  headers: { 
    'Accept': 'application/json'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=============================================
# Get device summary information
Get information about:

firmware version
framework version
API version
device model, type and name
device serial number
Responses
200

OK

Response Headers
application/json
Schema
Example (from schema)
Example
Schema
firmware_version string
version of firmware

framework_version string
Version and date of the talk module

frontend_version string
Version of frontend

api_version string
version of API

device_type string
Possible values: [panel, monitor]

Type of the device - panel, monitor etc.

device_name string
Device name, often matches the model name

device_model string
Possible values: [av01bd, av01d, av01ed, av01md, av01mfd, av02d, av03bd, av03d, av04fd, av04sd, av04fdi, av04sdi, av04fdip, av05fd, av05sd, av01kd, av01kbd, av02fdr, av02fde, av02ide, av02idr, av02ipd, av04afd, av04afdi, av04asd, ba04bd, ba04md, ba08bd, ba08md, ba12bd, ba12md, aa07bd, cr02bd]

Device model name

device_serial_number uuid
Serial number as UUID

commit string
Developers need it

GET /api/info
Request
Base URL
http://192.168.1.178/api/v1
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/api/info',
  headers: { 
    'Accept': 'application/json'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
====================================================================
# Set time after opening until locking
deprecated
This endpoint has been deprecated and may be removed in future versions of the API.

Time for which the relay contacts will be closed after opening

Path Parameters
lockNumber integer required
Possible values: [1, 2]

1 - first lock, 2 - second lock

application/json
Request Body required
lock_timeout integer required
Possible values: >= 1 and <= 40

Timeout in seconds

Responses
=================================================
# Get delay before unlocking
deprecated
This endpoint has been deprecated and may be removed in future versions of the API.

Time delay before panel relay contacts will be open

Path Parameters
lockNumber integer required
Possible values: [1, 2]

1 - first lock, 2 - second lock

Responses
200
401
OK

application/json
Schema
Example (from schema)
Example
Schema
lock_delay integer
Possible values: <= 9

Timeout in seconds
===============================================
# Open lock via HTTP
Open lock and trigger "access allowed" event via HTTP. In logs will be described as "Lock opened from the web interface"

Path Parameters
lockNumber integer required
Possible values: <= 8

0 - both locks, 1..8 - indexes available for the lock number

Query Parameters
unlockTime integer
Possible values: <= 604800

Custom unlock time in seconds

[0..604800], 0 - use default timeout from /access/general/unlock/timeout
Responses
200
400
401

GET /access/general/lock/open/remote/accepted/:lockNumber
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
lockNumber — path required
0 - both locks, 1..8 - indexes available for the lock number
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/general/lock/open/remote/accepted/:lockNumber',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
======================================
===========
# Get remote access server settings
Get remote access server settings.

If enabled - panel sends request to remote server and waits for response 10 s. If server doesn't respond during timeout panels takes access control itself. If custom server not specified request will be send to Link.

Device sends post request with application/json body:
{
  "identifier_number": "5a4sd7a5s4d5as3d54asd",
  "identifier_type": "card"
}

identifier_type can have three types: 'card', 'input_code' and 'qr'

Device waits for response with next application/json bodies:
Access not handled. Panel should handle access itself:

{
  "handled": false
} 

Access not granted:

{
  "handled": true,
  "access": {
    "granted": false
  }
}

Access granted, open first lock:

{
  "handled": true,
  "access": {
    "granted": true,
    "lock_number": 1
  }
} 

where 'lock_number' (lock to open) may take next values:
0 - both locks (1 and 2..8 if used SH-42 module)
1..8 - indexes available for the lock number
also, you can use GET /access/general/lock/open/remote/accepted/{lockNumber} to open specific lock
Responses
200
401
OK

application/json
Schema
Example (from schema)
Example
Schema
enabled boolean
describes feature status, true - on / false - off

custom_server_enabled boolean
Default value: false

is remote access from custom server enabled, true - on / false - off

custom_server_api_url string
url

GET /access/general/remote/control/settings
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/general/remote/control/settings',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
===========================================================

# Get remote access server settings
Get remote access server settings.

If enabled - panel sends request to remote server and waits for response 10 s. If server doesn't respond during timeout panels takes access control itself. If custom server not specified request will be send to Link.

Device sends post request with application/json body:
{
  "identifier_number": "5a4sd7a5s4d5as3d54asd",
  "identifier_type": "card"
}

identifier_type can have three types: 'card', 'input_code' and 'qr'

Device waits for response with next application/json bodies:
Access not handled. Panel should handle access itself:

{
  "handled": false
} 

Access not granted:

{
  "handled": true,
  "access": {
    "granted": false
  }
}

Access granted, open first lock:

{
  "handled": true,
  "access": {
    "granted": true,
    "lock_number": 1
  }
} 

where 'lock_number' (lock to open) may take next values:
0 - both locks (1 and 2..8 if used SH-42 module)
1..8 - indexes available for the lock number
also, you can use GET /access/general/lock/open/remote/accepted/{lockNumber} to open specific lock
Responses
200
401
OK

application/json
Schema
Example (from schema)
Example
Schema
enabled boolean
describes feature status, true - on / false - off

custom_server_enabled boolean
Default value: false

is remote access from custom server enabled, true - on / false - off

custom_server_api_url string
url

GET /access/general/remote/control/settings
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/general/remote/control/settings',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});

====================================
# Set remote access server settings
Set remote access server settings.

If enabled - panel sends request to remote server and waits for response 10 s. If server doesn't respond during timeout panels takes access control itself. If custom server not specified request will be send to Link.

Device sends post request with application/json body:
{
  "identifier_number": "5a4sd7a5s4d5as3d54asd",
  "identifier_type": "card"
}

identifier_type can have three types: 'card', 'input_code' and 'qr'

Device waits for response with next application/json bodies:
Access not handled. Panel should handle access itself:

{
  "handled": false
} 

Access not granted:

{
  "handled": true,
  "access": {
    "granted": false
  }
}

Access granted, open first lock:

{
  "handled": true,
  "access": {
    "granted": true,
    "lock_number": 1
  }
} 

where 'lock_number' (lock to open) may take next values:
0 - both locks (1 and 2..8 if used SH-42 module)
1..8 - indexes available for the lock number
also, you can use GET /access/general/lock/open/remote/accepted/{lockNumber} to open specific lock
application/json
Request Body required
anyOf
MOD1
MOD2
enabled boolean required
describes feature status, true - on / false - off

custom_server_enabled boolean required
If disabled panel will use link server remote control api

Responses
200
401
OK

POST /access/general/remote/control/settings
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body required
Default
Default
Custom
{
  "enabled": false,
  "custom_server_enabled": true
}
const axios = require('axios');
let data = JSON.stringify({
  "enabled": false,
  "custom_server_enabled": true
});

let config = {
  method: 'post',
  url: 'http://192.168.1.178/api/v1/access/general/remote/control/settings',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  },
  data : data
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})

===================================
# Open the lock from remote server
Open lock and trigger "access allowed" event via HTTP (for Remote Access Server needs). In logs will be described as "Lock is opened by Remote access server".

Path Parameters
lockNumber integer required
Possible values: <= 8

0 - both locks, 1..8 - indexes available for the lock number

Responses
200
400
401
OK

GET /access/general/lock/open/remote/control/accepted/:lockNumber
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
lockNumber — path required
0 - both locks, 1..8 - indexes available for the lock number
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/general/lock/open/remote/control/accepted/:lockNumber',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
==============================================
# Deny access from remote server
Show on display/play sound "access denied" via HTTP (for Remote Access Server needs). In logs will be described as "Access denied by Remote access server"

Responses
200
400
401
OK

GET /access/general/lock/open/remote/control/denied
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/general/lock/open/remote/control/denied',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=================================================
# Start emergency mode and open the locks
Open the locks in emergency mode for the specified time, unlock time must be in range [1 - 604800] seconds

application/json
Request Body required
locks object[]
Responses
200
400
401
OK

POST /access/general/lock/open/emergency
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body required
Default
Example
{
  "locks": [
    {
      "lock_number": 1,
      "unlock_time": 10000
    }
  ]
}
const axios = require('axios');
let data = JSON.stringify({
  "locks": [
    {
      "lock_number": 1,
      "unlock_time": 10000
    }
  ]
});

let config = {
  method: 'post',
  url: 'http://192.168.1.178/api/v1/access/general/lock/open/emergency',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  },
  data : data
};
=========================================================
# Cancel emergency mode and close the locks
Cancel emergency mode and close the locks

application/json
Request Body required
locks integer[] required
Possible values: <= 8

array of lock numbers that will be closed on emergency event

Responses
200
400
401
OK

POST /access/general/lock/close/emergency
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body required
Default
Example
{
  "locks": [
    1
  ]
}
const axios = require('axios');
let data = JSON.stringify({
  "locks": [
    1
  ]
});

let config = {
  method: 'post',
  url: 'http://192.168.1.178/api/v1/access/general/lock/close/emergency',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  },
  data : data
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
========================================================
# Create Identifier Entity
Create Identifier Entity. You can create identifiers with the next types:

card
ukey
inputCode
qr
license_plate
application/json
Request Body required
identifier_owner object required
identifier_type string required
Possible values: [card, ukey, inputCode, qr, license_plate]

type of identifier

identifier_number string required
hex or dec if identifier_type is card or ukey
dec if identifier_type is inputCode
uuid if identifier_type is qr
pattern for hex and dec if identifier_type is card or ukey - [0-9]{1,10} or ([0-9A-Fa-f]{2}[:-]){1,7}([0-9A-Fa-f]{2})
1..100 characters if identifier_type is license_plate
lock string required
Possible values: [second, all, first]

locks or locks that are linked to identifier

valid object
Responses
200
400
401
The uid value returned in the response can be used as the identifierUid parameter in next requests:

GET/PATCH/DELETE /access/identifier/item/{identifierUid} - to get info about identifier, update or delete it
POST /access/identifier/item/{identifierUid}/passes/reset - to reset left passes to max value
GET /access/identifier/item/{identifierUid}/qr - to generate QR image from identifier with type qr
POST/DELETE /access/identifier/item/{identifierUid}/timeprofile/{timeProfileUid} - to attach/detach a timeprofile to/from identifier
POST /apartment/item/{apartmentUid}/identifier/{identifierUid} - to attach an identifier to apartment
POST /apartment/item/unbind/identifier/{identifierUid} - to detach and identifier from apartment
application/json
Schema
Example (from schema)
Example
Schema
uid integer
Possible values: >= -1

UID for entities referenses. If value is -1, then it means that is no entity reference for this structure

POST /access/identifier
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body required
{
  "identifier_owner": {
    "name": "Sherlock Holmes",
    "type": "owner"
  },
  "identifier_type": "ukey",
  "identifier_number": "12345678",
  "lock": "first",
  "valid": {
    "time": {
      "is_permanent": true,
      "from": 1540819272,
      "to": 1540819272
    },
    "passes": {
      "is_permanent": true,
      "max_passes": 2
    }
  }
}
const axios = require('axios');
let data = JSON.stringify({
  "identifier_owner": {
    "name": "Sherlock Holmes",
    "type": "owner"
  },
  "identifier_type": "ukey",
  "identifier_number": "12345678",
  "lock": "first",
  "valid": {
    "time": {
      "is_permanent": true,
      "from": 1540819272,
      "to": 1540819272
    },
    "passes": {
      "is_permanent": true,
      "max_passes": 2
    }
  }
});
=================================================
# Get png representation of the stored QR identifier
Returns png representation of the stored QR identifier

Path Parameters
identifierUid integer required
Possible values: >= 1

Unique Id for physical/input code identifier

Query Parameters
locale string
Possible values: [en, ru, es, pl, nl, fr, uk]

Language for localizing logs. Value by default is 'en'

Responses
200
400
401
OK

image/png
Schema
Schema
string binary
GET /access/identifier/item/:identifierUid/qr
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
identifierUid — path required
Unique Id for physical/input code identifier
Accept

image/png
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/identifier/item/:identifierUid/qr',
  headers: { 
    'Accept': 'image/png', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=====================================================================
# Get Identifier Entity
Returns detailed info about Identifier

Path Parameters
identifierUid integer required
Possible values: >= 1

Unique Id for physical/input code identifier

Responses
200
400
401
OK

application/json
Schema
Example (from schema)
Example
Schema
identifier_owner object
identifier_type string
Possible values: [card, ukey, inputCode, qr, license_plate]

type of identifier

identifier_number string
hex or dec if identifier_type is card or ukey
dec if identifier_type is inputCode
uuid if identifier_type is qr
pattern for hex and dec if identifier_type is card or ukey - [0-9]{1,10} or ([0-9A-Fa-f]{2}[:-]){1,7}([0-9A-Fa-f]{2})
1..100 characters if identifier_type is license_plate
lock string
Possible values: [second, all, first]

locks or locks that are linked to identifier

valid object
apartment object
time_profiles object
additional object
GET /access/identifier/item/:identifierUid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
identifierUid — path required
Unique Id for physical/input code identifier
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/identifier/item/:identifierUid',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=============================================================
# Update Identifier Entity
Update Identifier Entity

Path Parameters
identifierUid integer required
Possible values: >= 1

Unique Id for physical/input code identifier

application/json
Request Body required
identifier_owner object required
identifier_type string required
Possible values: [card, ukey, inputCode, qr, license_plate]

type of identifier

identifier_number string required
hex or dec if identifier_type is card or ukey
dec if identifier_type is inputCode
uuid if identifier_type is qr
pattern for hex and dec if identifier_type is card or ukey - [0-9]{1,10} or ([0-9A-Fa-f]{2}[:-]){1,7}([0-9A-Fa-f]{2})
1..100 characters if identifier_type is license_plate
lock string required
Possible values: [second, all, first]

locks or locks that are linked to identifier

valid object
Responses
200
400
401
OK

PATCH /access/identifier/item/:identifierUid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
identifierUid — path required
Unique Id for physical/input code identifier
Body required
Default
Example
{
  "identifier_owner": {
    "name": "Sherlock Holmes",
    "type": "owner"
  },
  "identifier_type": "ukey",
  "identifier_number": "12345678",
  "lock": "first",
  "valid": {
    "time": {
      "is_permanent": true,
      "from": 1540819272,
      "to": 1540819272
    },
    "passes": {
      "is_permanent": true,
      "max_passes": 2
    }
  }
}
const axios = require('axios');
let data = JSON.stringify({
  "identifier_owner": {
    "name": "Sherlock Holmes",
    "type": "owner"
  },
  "identifier_type": "ukey",
  "identifier_number": "12345678",
  "lock": "first",
  "valid": {
    "time": {
      "is_permanent": true,
      "from": 1540819272,
      "to": 1540819272
    },
    "passes": {
      "is_permanent": true,
      "max_passes": 2
    }
  }
});
==========================================================
# Delete Identifier Entity
Delete Identifier Entity

Path Parameters
identifierUid integer required
Possible values: >= 1

Unique Id for physical/input code identifier

Responses
200
400
401
OK

DELETE /access/identifier/item/:identifierUid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
identifierUid — path required
Unique Id for physical/input code identifier
const axios = require('axios');

let config = {
  method: 'delete',
  url: 'http://192.168.1.178/api/v1/access/identifier/item/:identifierUid',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
====================================================
# Attach time profile to identifier
Attach time profile to identifier

Path Parameters
identifier-uid integer required
Possible values: >= 1

Unique Id for physical/input code identifier

timeprofile-uid integer required
Possible values: >= 1

Unique Id for time profile

Responses
200
400
401
OK

POST /access/identifier/item/:identifier-uid/timeprofile/:timeprofile-uid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
identifier-uid — path required
Unique Id for physical/input code identifier
timeprofile-uid — path required
Unique Id for time profile
const axios = require('axios');

let config = {
  method: 'post',
  url: 'http://192.168.1.178/api/v1/access/identifier/item/:identifier-uid/timeprofile/:timeprofile-uid',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=============================================================
# Detach time profile from identifier
Detach time profile from identifier

Path Parameters
identifier-uid integer required
Possible values: >= 1

Unique Id for physical/input code identifier

timeprofile-uid integer required
Possible values: >= 1

Unique Id for time profile

Responses
200
400
401
OK

DELETE /access/identifier/item/:identifier-uid/timeprofile/:timeprofile-uid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
identifier-uid — path required
Unique Id for physical/input code identifier
timeprofile-uid — path required
Unique Id for time profile
const axios = require('axios');

let config = {
  method: 'delete',
  url: 'http://192.168.1.178/api/v1/access/identifier/item/:identifier-uid/timeprofile/:timeprofile-uid',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
========================================================
# Reset Identifier left passes to max
Reset left passes to max, if there is a restriction on the number of passes specified in the identifier settings

Path Parameters
identifierUid integer required
Possible values: >= 1

Unique Id for physical/input code identifier

Responses
200
400
401
OK

POST /access/identifier/item/:identifierUid/passes/reset
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
identifierUid — path required
Unique Id for physical/input code identifier
const axios = require('axios');

let config = {
  method: 'post',
  url: 'http://192.168.1.178/api/v1/access/identifier/item/:identifierUid/passes/reset',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=======================================================================
# Get identifiers list
Returns identifiers list with options could be used to sort and filter them

Query Parameters
limit integer required
Possible values: [10, 20, 30, 50]

Default value: 10

Number of items. Value by default is 10

page_number integer required
Possible values: >= 1

Default value: 1

Page number

order_by string
sorting expression:
[field name 1], [field name 2]... <order (asc or desc)>

filter string
Filtering expression:
[field name] [compare operator] [value] <logical operator>...

field name	see the list of available fields in filter.available_fields[].field_name
value	see the list of available values in filter.available_fields[].options object, may be missing
compare operator	see the list of available operators in filter.available_fields[].compare_operators array
Compare operators	Description	Example
eq	Equal	name eq 'Sherlock Holmes'
gt	Greater than	building gt 10
lt	Less than	building lt 10
nq	Not equal	name nq 'Sherlock Holmes'
ge	Greater than or equal	floor ge 5
le	Less than or equal	floor le 5
Logical operators		
and	logical AND	floor le 10 and floor gt 3
or	logical OR	floor le 3 or floor gt 10
not	logical NOT	not floor le 3
group operations		
()	group by priority	(name eq 'Sherlock Holmes' or building eq 221) and floor gt 10
Responses
200
400
401
OK

application/json
Schema
Example (from schema)
Example
Schema
list_option object
list_items object[]
array of identifiers

GET /access/identifier/items
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
limit — query required

---
page_number — query required
Page number
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/identifier/items',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=============================================
# Delete multiple Identifier items
Delete multiple Identifier items

application/json
Request Body
uid_items integer[] required
Possible values: >= -1

Array of UID for entities referenses.

Responses
200
400
401
OK

DELETE /access/identifier/items
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body
Default
Example
{
  "uid_items": [
    11,
    13,
    23,
    42
  ]
}
const axios = require('axios');
let data = JSON.stringify({
  "uid_items": [
    11,
    13,
    23,
    42
  ]
});

let config = {
  method: 'delete',
  url: 'http://192.168.1.178/api/v1/access/identifier/items',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  },
  data : data
};
====================================================================
# Update multiple Identifier items by link_id
Create or Update multiple Identifier items.

This request is used by Link management system. Link adds to each identifier and apartment link_id and apartment_link_id to link them together.

They can be added to multiple panels and removed by link_id param using DELETE /access/identifier/items/link

application/json
Request Body required
list_items object[]
list of identifiers from link

Responses
200
400
401
OK

application/json
Schema
Example (from schema)
Created
Updated
Identifiers exceeded
Schema
result object[]
POST /access/identifier/items/link
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body required
Default
Example
{
  "list_items": [
    {
      "identifier_owner": {
        "name": "Sherlock Holmes",
        "type": "owner"
      },
      "identifier_type": "ukey",
      "identifier_number": "12345678",
      "lock": "first",
      "valid": {
        "time": {
          "is_permanent": true,
          "from": 1540819272,
          "to": 1540819272
        },
        "passes": {
          "is_permanent": true,
          "max_passes": 2
        }
      },
      "time_profiles": {
        "link_ids": [
          "91c615e3-1040-4815-8ecb-039a18b756b5"
        ]
      },
      "link_id": "91c615e3-1040-4815-8ecb-039a18b756b5",
      "apartment_link_id": "91c615e3-1040-4815-8ecb-039a18b756b5",
      "additional": {
        "passes_left": 4
      }
    }
  ]
}
===================================================================
# Delete multiple Identifier items by link_id
Delete multiple Identifier items by link_id param. This request is used by Link management system to remove identifiers from panel.

application/json
Request Body
link_ids uuid[]
array of ids from Link

Responses
200
400
401
OK

application/json
Schema
Example (from schema)
Deleted
Not found
Schema
result object[]
DELETE /access/identifier/items/link
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body
Default
Example
{
  "link_ids": [
    "91c615e3-1040-4815-8ecb-039a18b756b5"
  ]
}
const axios = require('axios');
let data = JSON.stringify({
  "link_ids": [
    "91c615e3-1040-4815-8ecb-039a18b756b5"
  ]
});

let config = {
  method: 'delete',
  url: 'http://192.168.1.178/api/v1/access/identifier/items/link',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  },
  data : data
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));

=======================================================================
# Get multiple Identifier items with link_id
Get multiple Identifier items with link_id.

This can be used by 3d-patry management system. Link adds to each identifier and apartment link_id and apartment_link_id to link them together.

Query Parameters
limit integer required
Possible values: [10, 20, 30, 50]

Default value: 10

Number of items. Value by default is 10

page_number integer required
Possible values: >= 1

Default value: 1

Page number

order_by string
sorting expression:
[field name 1], [field name 2]... <order (asc or desc)>

filter string
Filtering expression:
[field name] [compare operator] [value] <logical operator>...

field name	see the list of available fields in filter.available_fields[].field_name
value	see the list of available values in filter.available_fields[].options object, may be missing
compare operator	see the list of available operators in filter.available_fields[].compare_operators array
Compare operators	Description	Example
eq	Equal	name eq 'Sherlock Holmes'
gt	Greater than	building gt 10
lt	Less than	building lt 10
nq	Not equal	name nq 'Sherlock Holmes'
ge	Greater than or equal	floor ge 5
le	Less than or equal	floor le 5
Logical operators		
and	logical AND	floor le 10 and floor gt 3
or	logical OR	floor le 3 or floor gt 10
not	logical NOT	not floor le 3
group operations		
()	group by priority	(name eq 'Sherlock Holmes' or building eq 221) and floor gt 10
Responses
200
401
OK

application/json
Schema
Example (from schema)
Example
Schema
list_items object[]
list of identifiers

list_option object
GET /access/identifier/items/link
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
limit — query required

---
page_number — query required
Page number
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/identifier/items/link',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=================================================================
# Create Time Profile Entity
Create Time Profile Entity. It describes access rules which can be attached to identifiers.

application/json
Request Body required
name string required
time profile name

time_options object required
repeat_options object required
Responses
200
400
401
The uid value returned in the response can be used as the timeProfileUid parameter in:

GET /access/timeprofile/item/{timeProfileUid} - to get info about time profile
PATH /access/timeprofile/item/{timeProfileUid} - to update time profile
DELETE /access/timeprofile/item/{timeProfileUid} - to remove time profile
POST /access/identifiers/item/{identifierUid}/timeProfile/{timeProfileUid} - to attach time profile to identifier with id identifierUid
DELETE /access/identifiers/item/{identifierUid}/timeProfile/{timeProfileUid} - to detach time profile from identifier with id identifierUid
application/json
Schema
Example (from schema)
Example
Schema
uid integer
Possible values: >= -1

UID for entities referenses. If value is -1, then it means that is no entity reference for this structure

POST /access/timeprofile
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body required

Default
One day
Daily
Daily until date
Weekly
Every two weeks
Monthly
Yearly
First day of the month
Work week

{
  "name": "Work week",
  "time_options": {
    "is_all_day": true,
    "date_from": 1540819272,
    "date_to": 1540819272
  },
  "repeat_options": {
    "repeat_enable": true,
    "repeat_format": {
      "repeat_type": "day",
      "repeat_end": {
        "format": "date",
        "date": 1540819272
      },
      "repeat_custom": {
        "repeat_point_type": "week",
        "repeat_looper": 5,
        "repeat_options": [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI"
        ]
      }
    }
  }
}
==================================================
# Get Time Profile Entity
Returns Time Profile Entity

Path Parameters
timeProfileUid integer required
Possible values: >= 1

Unique Id for time profile

Responses
200
400
401
OK

application/json

Schema
Example (from schema)
One day
Daily
Daily until date
Weekly
Every two weeks
Monthly
Yearly
First day of the month
Work week

Schema
name string
time profile name

time_options object
repeat_options object
identifiers object
GET /access/timeprofile/item/:timeProfileUid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
timeProfileUid — path required
Unique Id for time profile
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/timeprofile/item/:timeProfileUid',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
===================================================================
# Update Time Profile Entity
Update Time Profile Entity

Path Parameters
timeProfileUid integer required
Possible values: >= 1

Unique Id for time profile

application/json
Request Body required
name string required
time profile name

time_options object required
repeat_options object required
Responses
200
400
401
OK

PATCH /access/timeprofile/item/:timeProfileUid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
timeProfileUid — path required
Unique Id for time profile
Body required
Default
Work week
{
  "name": "Work week",
  "time_options": {
    "is_all_day": true,
    "date_from": 1540819272,
    "date_to": 1540819272
  },
  "repeat_options": {
    "repeat_enable": true,
    "repeat_format": {
      "repeat_type": "day",
      "repeat_end": {
        "format": "date",
        "date": 1540819272
      },
      "repeat_custom": {
        "repeat_point_type": "week",
        "repeat_looper": 5,
        "repeat_options": [
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI"
        ]
      }
    }
  }
}
==============================================================
# Delete Time Profile Entity
Delete Time Profile Entity

Path Parameters
timeProfileUid integer required
Possible values: >= 1

Unique Id for time profile

Responses
200
400
401
OK

DELETE /access/timeprofile/item/:timeProfileUid
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
timeProfileUid — path required
Unique Id for time profile
const axios = require('axios');

let config = {
  method: 'delete',
  url: 'http://192.168.1.178/api/v1/access/timeprofile/item/:timeProfileUid',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=====================================================
# Get Time Profiles list
Returns Time Profiles list

Query Parameters
limit integer required
Possible values: [10, 20, 30, 50]

Default value: 10

Number of items. Value by default is 10

page_number integer required
Possible values: >= 1

Default value: 1

Page number

order_by string
sorting expression:
[field name 1], [field name 2]... <order (asc or desc)>

filter string
Filtering expression:
[field name] [compare operator] [value] <logical operator>...

field name	see the list of available fields in filter.available_fields[].field_name
value	see the list of available values in filter.available_fields[].options object, may be missing
compare operator	see the list of available operators in filter.available_fields[].compare_operators array
Compare operators	Description	Example
eq	Equal	name eq 'Sherlock Holmes'
gt	Greater than	building gt 10
lt	Less than	building lt 10
nq	Not equal	name nq 'Sherlock Holmes'
ge	Greater than or equal	floor ge 5
le	Less than or equal	floor le 5
Logical operators		
and	logical AND	floor le 10 and floor gt 3
or	logical OR	floor le 3 or floor gt 10
not	logical NOT	not floor le 3
group operations		
()	group by priority	(name eq 'Sherlock Holmes' or building eq 221) and floor gt 10
Responses
200
400
401
OK

application/json

Schema
Example (from schema)
Example
Equal ` Work week`
Since Monday, October 29, 2018 1:21:11 P M (1540819271 timestamp)
Until Monday, October 29, 2018 1:21:13 P M (1540819273 timestamp)

Schema
list_items object[]
list of time profiles

list_option object
GET /access/timeprofile/items
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
limit — query required

---
page_number — query required
Page number
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/timeprofile/items',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=====================================================
# Get door sensor setings
Returns info about door sensor options

Responses
200
401
OK

application/json
Schema
Example (from schema)
Example
Schema
enable boolean
describes feature status, true - on / false - off

repeating_message_delay integer
Time in seconds after which the panel will send the next message if the sensor is not closed

repeating_message_enable boolean
Resending messages if one message is not enough

opening_delay integer
Time that the door sensor must be open to start sending alerts

available_modes string[]
Possible values: [door_sensor, call_button]

door sensor - the contacts work as contacts of a door sensor, when the contacts are opened after the time specified in the parameter, the panel sends a message that the door has been open for too long

call_button - when the contacts are closed, a call is made to the paired monitor or concierge

mode string
Possible values: [door_sensor, call_button]

schema describes variants of door access mode

GET /access/door/sensor
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/door/sensor',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
============================================================
# Get current door sensor status
Returns info about door sensor status

Responses
200
400
401
OK

application/json
Schema
Example (from schema)
Example
Schema
is_timeout_exceed boolean
timeout status

status string
Possible values: [open, closed]

describes door state

opentime integer
time for which door remains open in seconds

mode string
which mode door_sensor/call_button

GET /access/door/status
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/access/door/status',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
==============================================================
# Get logs list
Get logs list. Available events:

Access
access_denied_by_not_valid_identifier
access_denied_by_not_valid_input_code
access_denied_by_remote_server_api_call
access_denied_by_web_api_call
access_denied_by_unknown_card
access_granted_by_valid_identifier
access_granted_by_master_code
access_granted_by_api_call
access_granted_by_call_host
access_granted_by_remote_server_api_call
lock_was_opened_by_exit_btn
access_denied_by_unknown_qr_code
lock_is_opened_too_long
door_sensor_was_closed
door_sensor_was_opened
Info
outgoing_call
incoming_call
lock_is_opened_too_long
System
successful_login_api_call
incorrect_login_api_call
Query Parameters
locale string
Possible values: [en, ru, es, pl, nl, fr, uk]

Language for localizing logs. Value by default is 'en'

from integer
Unix time

to integer
Unix time

limit integer required
Possible values: [10, 20, 30, 50]

Default value: 10

Number of items. Value by default is 10

page_number integer required
Possible values: >= 1

Default value: 1

Page number

order_by string
sorting expression:
[field name 1], [field name 2]... <order (asc or desc)>

filter string
Filtering expression:
[field name] [compare operator] [value] <logical operator>...

field name	see the list of available fields in filter.available_fields[].field_name
value	see the list of available values in filter.available_fields[].options object, may be missing
compare operator	see the list of available operators in filter.available_fields[].compare_operators array
Compare operators	Description	Example
eq	Equal	name eq 'Sherlock Holmes'
gt	Greater than	building gt 10
lt	Less than	building lt 10
nq	Not equal	name nq 'Sherlock Holmes'
ge	Greater than or equal	floor ge 5
le	Less than or equal	floor le 5
Logical operators		
and	logical AND	floor le 10 and floor gt 3
or	logical OR	floor le 3 or floor gt 10
not	logical NOT	not floor le 3
group operations		
()	group by priority	(name eq 'Sherlock Holmes' or building eq 221) and floor gt 10
Responses
200
400
401
OK

application/json
Schema
Example (from schema)
Example
Schema
list_option object
list_items object[]
GET /log/items
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
limit — query required

---
page_number — query required
Page number
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/log/items',
  headers: { 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=====================================================
# Adds the given IP addresses to the whitelist
Adds the IP addresses from the white list

Available on all panels
application/json
Request Body required
addresses string[]
Possible values: >= 7 characters and <= 15 characters

Array of strings with IPv4

Responses
200
400
401
OK

PUT /security/whitelist
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Body required
{
  "addresses": [
    "192.168.1.1",
    "192.168.0.1"
  ]
}
const axios = require('axios');
let data = JSON.stringify({
  "addresses": [
    "192.168.1.1",
    "192.168.0.1"
  ]
});

let config = {
  method: 'put',
  url: 'http://192.168.1.178/api/v1/security/whitelist',
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 
    'Authorization': 'Bearer <TOKEN>'
  },
  data : data
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
================================================================
# Take snapshot from IP camera
Takes snapshot from device camera and returns image converted to Base64 string

Image format: webp
Responses
200
401
OK

image/jpeg
Schema
Schema
string binary
model describes .jpeg files and other files of similar format

GET /photo/file
Authorization
Request
Base URL
http://192.168.1.178/api/v1
Bearer Token
Bearer Token
Accept

image/jpeg
const axios = require('axios');

let config = {
  method: 'get',
  url: 'http://192.168.1.178/api/v1/photo/file',
  headers: { 
    'Accept': 'image/jpeg', 
    'Authorization': 'Bearer <TOKEN>'
  }
};

axios(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
=====================================================
