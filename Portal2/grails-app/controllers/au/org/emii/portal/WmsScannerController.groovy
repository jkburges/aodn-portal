package au.org.emii.portal

import grails.converters.JSON

class WmsScannerController {
    def grailsApplication

    def serverTypesToShow = [ "WMS-1.1.1",
                              "WMS-1.3.0",
                              "NCWMS-1.1.1",
                              "NCWMS-1.3.0" ]

    def statusText = [ (0): "Enabled",
                      (-1): "Enabled<br />(errors&nbsp;occurred)",
                      (-2): "Stopped<br />(too&nbsp;many&nbsp;errors)" ]
    
    def controls = {
        
        def conf = Config.activeInstance()
        def wmsScannerBaseUrl = grailsApplication.config.wmsScanner.url
        wmsScannerBaseUrl += _optionalSlash( wmsScannerBaseUrl ) // Ensure trailing slash
        
        // Check if WMS Scanner settings are valid
        if ( !wmsScannerBaseUrl || !conf.wmsScannerCallbackUsername || !conf.wmsScannerCallbackPassword ) {
            
            flash.message = "All three settings: 'WmsScannerBaseUrl', 'WmsScannerCallbackUsername', and 'WmsScannerCallbackPassword' must have values to use a WMS Scanner."
            
            return [ configInstance: conf, wmsScannerBaseUrl: wmsScannerBaseUrl, scanJobList: [], statusText: statusText, serversToList: [] ]
        }
        
        def callbackUrl = URLEncoder.encode( _saveOrUpdateCallbackUrl() )
        def scanJobList
        
        def url
        def conn
        
        try {
            url = "${ _scanJobUrl() }list?callbackUrl=$callbackUrl".toURL()
            conn = url.openConnection()
            conn.connect()
            
            scanJobList = JSON.parse( conn.content.text ) // Makes the call
        }
        catch (Exception e) {
            
            setFlashMessage e, url, conn
            scanJobList = [] // Empty list
        }
        
        return [ configInstance: conf,
                 wmsScannerBaseUrl: wmsScannerBaseUrl,
                 scanJobList: scanJobList,
                 statusText: statusText,
                 serversToList: Server.findAllByTypeInListAndAllowDiscoveries( serverTypesToShow, true, [ sort: "name" ] )
               ]
    }

    def callRegister = {
        
        def conf = Config.activeInstance()

        def url
        def conn
        
        try {
            Server server = Server.get( params.serverId )
            
            def versionVal = server.type.replace( "NCWMS-", "" ).replace( "WMS-", "" )
            
            def jobName     = URLEncoder.encode( "Server scan for '${server.name}'" )
            def jobDesc     = URLEncoder.encode( "Created by Portal, ${new Date().format( "dd/MM/yyyy hh:mm" )}" )
            def jobType     = "WMS"
            def wmsVersion  = URLEncoder.encode( versionVal )
            def uri         = URLEncoder.encode( server.uri )
            def callbackUrl = URLEncoder.encode( _saveOrUpdateCallbackUrl() )
            def callbackUsername = URLEncoder.encode( conf.wmsScannerCallbackUsername )
            def callbackPassword = URLEncoder.encode( conf.wmsScannerCallbackPassword )
            def scanFrequency = server.scanFrequency
            
            // Perform action
            def address = "${ _scanJobUrl() }register?jobName=$jobName&jobDescription=$jobDesc&jobType=$jobType&wmsVersion=$wmsVersion&uri=$uri&callbackUrl=$callbackUrl&callbackUsername=$callbackUsername&callbackPassword=$callbackPassword&scanFrequency=$scanFrequency"
        
            url = address.toURL()   
            conn = url.openConnection()
            conn.connect()
            
            def response = executeCommand( conn )
            
            setFlashMessage response
        }
        catch (Exception e) {
            
            setFlashMessage e, url, conn
        }

        redirect action: "controls"
    }

    def callUpdate = {

        def conf = Config.activeInstance()
        
        def server = Server.findWhere( uri: params.scanJobUri )
        
        def versionVal  = server.type.replace( "NCWMS-", "" ).replace( "WMS-", "" )
        
        def jobType     = "WMS"
        def wmsVersion  = URLEncoder.encode( versionVal )
        def uri         = URLEncoder.encode( server.uri )
        def callbackUrl = URLEncoder.encode( _saveOrUpdateCallbackUrl() )
        def callbackUsername = URLEncoder.encode( conf.wmsScannerCallbackUsername )
        def callbackPassword = URLEncoder.encode( conf.wmsScannerCallbackPassword )
        def scanFrequency = server.scanFrequency
        
        def address = "${ _scanJobUrl() }update?id=${params.scanJobId}&callbackUrl=$callbackUrl&callbackUsername=$callbackUsername&callbackPassword=$callbackPassword&jobType=$jobType&wmsVersion=$wmsVersion&uri=$uri&scanFrequency=$scanFrequency"
        
        def url
        def conn
        
        try {
            url = address.toURL()
            conn = url.openConnection()
            conn.connect()
            
            def response = executeCommand( conn )
            
            setFlashMessage response
        }
        catch (Exception e) {
            
            setFlashMessage e, url, conn
        }        
        
        redirect action: "controls"
    }
    
    def callDelete = {
        
        def conf = Config.activeInstance()

        def callbackUrl = URLEncoder.encode( _saveOrUpdateCallbackUrl() )
        def address = "${ _scanJobUrl() }delete?id=${params.scanJobId}&callbackUrl=$callbackUrl"
        
        def url
        def conn
        
        try {
            url = address.toURL()
            conn = url.openConnection()
            conn.connect()
            
            def response = executeCommand( conn )
            
            setFlashMessage response
        }
        catch (Exception e) {
            
            setFlashMessage e, url, conn
        }        
        
        redirect action: "controls"
    }
        
    private void setFlashMessage(String response) {
        
        flash.message = "Response: $response"
    }
    
    private void setFlashMessage(e, commandUrl, connection) {
        
        def msg = ""
        
        if ( connection?.errorStream ) {

            Reader reader = new BufferedReader( new InputStreamReader( connection.errorStream ) )
            def currentLine
            
            while ( ( currentLine = reader.readLine() ) != null ) {

                msg += "<br /><b>$currentLine</b>"
            }
            
            if ( msg.contains( "<html") ) {

                msg = "<br /><i>HTML response (HTTP code: ${connection.responseCode})</i>"
            }
            
            msg = "<br />Response: $msg"    
        }
        
        msg = "$e$msg"
        
        if ( flash.message?.trim() ) {
            
            flash.message += "<hr>$msg"
        }
        else {
            flash.message = msg
        }
    }
    
    def executeCommand( conn ) {

        def response = conn.content.text // Executes command

        if ( response.contains( "<html" ) ) {

            response = "HTML response (Code: ${ conn.responseCode })"
        }

        return response
    }

    def _saveOrUpdateCallbackUrl() {

        def portalBaseUrl = grailsApplication.config.grails.serverURL
        def slash = _optionalSlash( portalBaseUrl )

        return "${portalBaseUrl}${slash}layer/saveOrUpdate"
    }

    def _scanJobUrl() {

        def wmsScannerBaseUrl = grailsApplication.config.wmsScanner.url
        def slash = _optionalSlash( wmsScannerBaseUrl )

        return "${wmsScannerBaseUrl}${slash}scanJob/"
    }

    def _optionalSlash( url ) { // Todo - DN: Change to _ensureTrailingSlash

        return url[-1..-1] != "/" ? "/" : ""
    }
}