FORMAT: 1A
# Group Configs
API related to creating, modifying and viewing configs.

## Config Collection [/config]

### Create a config [POST]
Create a new config. The config will be initialized but will not be added to the build queue until it meets all the requirements, both resources and the settings.
+ Request (application/json)

        {
        	"name": "tablika",
        	"platform": "ios"
        }

+ Response 201
    + Headers
            Location: /api/v1/config/tablika

### List configs [GET]
+ Response 200

    + Body

            ["cail","tablika"]

## Config [/config/{name}]
+ Parameters
    + name (string) ... Name of the config

### View a config [GET]
+ Response 200

    + Body

    {
      "settings": {
        "app": {
          "urlName": "tablika",
          "urlScheme": "tablika",
          "name": "Tablika",
          "bundleId": "com.tablika"
        },
        "config": {
          "url": {
            "termsOfUse": "http://www.tablika.com/terms-of-use",
            "privacyPolicy": "http://www.tablika.com/privacy-policy",
            "help": "http://tablika.com/help/",
            "about": "http://tablika.com/about",
            "portal": "https://portal.tablika.com",
            "production": "tablika.com"
          },
          "api": {
            "url": "https://portal.tablika.com/api",
            "brand": "main"
          },
          "features": {
            "anonymousLogin": "Yes",
            "publicApps": "Yes"
          },
          "hockeyApp": {
            "appId": "c3415a8f964531b7548fbdfa71e2d078"
          },
          "googleAnalytics": {
            "trackingId": "UA-62668734-1"
          },
          "appearance": {
            "primaryColor": "163,36,42"
          },
          "copyright": "Tablika © 2015",
          "isProduction": "Yes",
          "introYouTubeVideoId": "9Gs7iJ3lIVg"
        }
      },
      "summary": {
        "Application URL Scheme": "tablika",
        "Application Name": "Tablika",
        "Application Bundle Identifier": "com.tablika",
        "Terms of Use URL": "http://www.tablika.com/terms-of-use",
        "Privacy Policy URL": "http://www.tablika.com/privacy-policy",
        "Help URL": "http://tablika.com/help/",
        "About Page URL": "http://tablika.com/about",
        "Portal URL": "https://portal.tablika.com",
        "Production URL": "tablika.com",
        "API Endpoint": "https://portal.tablika.com/api",
        "Brand": "main",
        "Anonymous Login": "Yes",
        "List Public Apps": "Yes",
        "Primary Color": "163,36,42",
        "Copyright": "Tablika © 2015"
      },
      "resources": [
        {
          "name": "Default.png",
          "url": "/api/v1/config/tablika.prod/resources/Default.png"
        }
      ],
      "isReady": false
    }

## Config settings [/config/{name}/settings]
+ Parameters
    + name (string) ... Name of the config

### Update config settings [PUT]
+ Request (application/json)

{
  "app": {
    "versionName": "1.0.0 TEST",
    "name": "Test Case",
    "bundleId": "com.monkey.testcase",
    "urlName": "cailmobility.dev",
    "urlScheme": "cailmobility.dev"
  },
  "config": {
    "url": {
      "termsOfUse": "http://cailmobility.com/terms-of-use/",
      "privacyPolicy": "http://cailmobility.com/privacy-policy/",
      "help": "http://cailmobility.com/help/",
      "about": "http://cailmobility.com/about/",
      "portal": "https://dev.cailmobility.net",
      "production": "cailmobility.com"
    },
    "api": {
      "url": "https://dev.cailmobility.net/api",
      "brand": "main"
    },
    "features": {
      "anonymousLogin": "No",
      "publicApps": "No"
    },
    "appearance": {
      "primaryColor": "14,65,134"
    },
    "hockeyApp": {
      "appId": "7e51807aa670b58b3a06d67a4d57e7c9"
    },
    "googleAnalytics": {
      "trackingId": "UA-62670622-1"
    },
    "copyright": null,
    "isProduction": "No",
    "introYouTubeVideoId": "DC_s9_M9UFk"
  }
}


+ Response 200

    + Body

    {
      "settings": {
        "app": {
          "urlName": "cailmobility.dev",
          "urlScheme": "cailmobility.dev",
          "name": "Test Case",
          "bundleId": "com.monkey.testcase"
        },
        "config": {
          "url": {
            "termsOfUse": "http://cailmobility.com/terms-of-use/",
            "privacyPolicy": "http://cailmobility.com/privacy-policy/",
            "help": "http://cailmobility.com/help/",
            "about": "http://cailmobility.com/about/",
            "portal": "https://dev.cailmobility.net",
            "production": "cailmobility.com"
          },
          "api": {
            "url": "https://dev.cailmobility.net/api",
            "brand": "main"
          },
          "features": {
            "anonymousLogin": "No",
            "publicApps": "No"
          },
          "hockeyApp": {
            "appId": "7e51807aa670b58b3a06d67a4d57e7c9"
          },
          "googleAnalytics": {
            "trackingId": "UA-62670622-1"
          },
          "appearance": {
            "primaryColor": "14,65,134"
          },
          "copyright": "Tablika © 2015",
          "isProduction": "No",
          "introYouTubeVideoId": "DC_s9_M9UFk"
        }
      }
    }

## Config Resource Collection [/config/{name}/resources]
+ Parameters
    + name (string) ... Name of the config

### Upload resources [PUT]
+ Request (multipart/form-data; boundary=---BOUNDARY)

        -----BOUNDARY
        Content-Disposition: form-data; name="Default.png"; filename="Default.png"
        Content-Type: image/png

        ...CONTENT...
        -----BOUNDARY

+ Response
  {
    "warnings": [],
    "files": [
      {
        "name": "Icon-76.png",
        "url": "/api/v1/config/testcase/resources/Icon-76.png"
      }
    ],
    "errors": []
  }

## Config Resource [/config/{name}/resources/{resName}]
+ Parameters
    + name (string) ... Name of the config
    + resName (string) ... The name of the resource including file extension.

### Get Resource [GET]
+ Response 200 (image/png)

## Validation [/config/{name}/validation]
+ Parameters
    + name (string) ... Name of the config
    
### Get Validation Status [GET]
+ Response 200 (application/json)

  {
    "settings": {
      "isValid": false,
      "errors": [
        {
          "message": "this property is required.",
          "keyPath": "app.urlScheme",
          "$leaf": true
        }
      ]
    },
    "resources": {
      "isValid": false,
      "remainingFiles": [
        {
          "name": "logo.png",
          "size": "500x500"
        }
      ]
    },
    "isValid": false
  }
