public with sharing class dataCloud_CTRL {
    @AuraEnabled(cacheable=true)
    public static String getDataCloudDataFromSQLQuery(String sRecordId, String sObjectName, String sQuery, String sFilterFieldName, Boolean bDebug) {
        system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sRecordId:' + sRecordId + '- sObjectName:' + sObjectName + ' - sQuery:' + sQuery + '- sFilterFieldName:' + sFilterFieldName + '- bDebug:' + bDebug);
        
        String sResponse = '';
        String sQueryCurrentRecord = '';
        String sFilterFieldValue = '';

        if(sFilterFieldName != null && sFilterFieldName != ''){
            // Get Current Record information based on filterFieldName
            sQueryCurrentRecord = 'SELECT Id, ' + sFilterFieldName + ' FROM ' + sObjectName + ' WHERE Id = \'' + sRecordId +  '\' LIMIT 1';
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sQueryCurrentRecord:' + sQueryCurrentRecord);

            sObject oCurrentRecord = Database.query(sQueryCurrentRecord);
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - oCurrentRecord:' + oCurrentRecord);

            if(oCurrentRecord != null){
                sFilterFieldValue = (String) oCurrentRecord.get(sFilterFieldName);
                if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sFilterFieldValue:' + sFilterFieldValue);
            }
        }

        if(sQuery != null && sQuery != ''){ 
            Http oHttp = new Http();
            HttpRequest oRequest = new HttpRequest();    
            
            // OAuth JWT Bearer
            // Recover username of the current user in the other org
            OAuth_JWTBearer_Connection oJWTConn = new OAuth_JWTBearer_Connection('DataCloud', null);
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery() - accessCode: ' + oJWTConn.accessCode.substring(0, 15));
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery() - instanceUrl: ' + oJWTConn.instanceUrl);       
            
            oRequest.setEndpoint(oJWTConn.instanceUrl + '/services/data/v58.0/ssot/query');
            oRequest.setHeader('Authorization', 'Bearer ' + oJWTConn.accessCode);
            oRequest.setHeader('Content-Type', 'application/json');
            oRequest.setMethod('POST');
            oRequest.setTimeout(120000);
            
            if(sQuery.contains('###FilterFieldValue###')){
                sQuery = sQuery.replace('###FilterFieldValue###', '\'' + sFilterFieldValue + '\'');
            }
            String sqlQueryJSON = '{ "sql" : "' + sQuery + '"}';

            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery() - sqlQueryJSON: ' + sqlQueryJSON);       
            
            oRequest.setBody(sqlQueryJSON);

            HttpResponse oResponse = oHttp.send(oRequest);

            if(oResponse.getStatusCode() == 200 || oResponse.getStatusCode() == 201) {
                sResponse = oResponse.getBody();

                if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sResponse:' + sResponse);

                // Deserialize the JSON string into collections of primitive data types.
                Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(sResponse);
            }
        }
        return sResponse;
    }

    @AuraEnabled(cacheable=true)
    public static String getDataCloudDataFromCalculatedInsightQuery(String sRecordId, String sObjectName, String sCalculatedInsightname, String sMeasures, String sDimensions, String sFilters, String sFilterFieldName, Integer iBatchSize, String sOrderby, Boolean bDebug) {
        system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery - sRecordId:' + sRecordId + '- sObjectName:' + sObjectName + ' - sCalculatedInsightname:' + sCalculatedInsightname + '- sMeasures:' + sMeasures + '- sDimensions:' + sDimensions + '- sFilters:' + sFilterFieldName + '- sFilterFieldName:' + sFilters + '- iBatchSize:' + iBatchSize + '- sOrderby:' + sOrderby + '- bDebug:' + bDebug);
        
        String sResponse = '';
        String sQueryCurrentRecord = '';
        String sFilterFieldValue = '';

        if(sFilterFieldName != null && sFilterFieldName != ''){
            // Get Current Record information based on filterFieldName
            sQueryCurrentRecord = 'SELECT Id, ' + sFilterFieldName + ' FROM ' + sObjectName + ' WHERE Id = \'' + sRecordId +  '\' LIMIT 1';
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery - sQueryCurrentRecord:' + sQueryCurrentRecord);

            sObject oCurrentRecord = Database.query(sQueryCurrentRecord);
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery - oCurrentRecord:' + oCurrentRecord);

            if(oCurrentRecord != null){
                sFilterFieldValue = (String) oCurrentRecord.get(sFilterFieldName);
                if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery - sFilterFieldValue:' + sFilterFieldValue);
            }
        }

        if(sCalculatedInsightname != null && sCalculatedInsightname != ''){ 
            Http oHttp = new Http();
            HttpRequest oRequest = new HttpRequest();    
            
            // OAuth JWT Bearer
            // Recover username of the current user in the other org
            OAuth_JWTBearer_Connection oJWTConn = new OAuth_JWTBearer_Connection('DataCloud', null);
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery() - accessCode: ' + oJWTConn.accessCode.substring(0, 15));
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery() - instanceUrl: ' + oJWTConn.instanceUrl);       
            
            oRequest.setHeader('Authorization', 'Bearer ' + oJWTConn.accessCode);
            oRequest.setHeader('Content-Type', 'application/json');
            oRequest.setMethod('GET');
            oRequest.setTimeout(120000);

            String sEndpoint = '/services/data/v58.0/ssot/insight/calculated-insights/' + sCalculatedInsightname + '?';
            String sParameter = '';
            if(sMeasures != null && sMeasures != '') {sParameter += '&measures=' + sMeasures;}
            if(sDimensions != null && sDimensions != '') {sParameter += '&dimensions=' + sDimensions;}
            if(sFilters != null && sFilters != '') {
                if(sFilters.contains('###FilterFieldValue###')){
                    sFilters = sFilters.replace('###FilterFieldValue###', sFilterFieldValue);
                }
                sParameter += '&filters=' + sFilters;
            }
            if(iBatchSize != null) {sParameter += '&batchSize=' + iBatchSize;}
            if(sOrderby != null && sOrderby != '') {sParameter += '&orderBy=' + sOrderby;}
            sParameter = sParameter.replace(' ','%20');
            
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery() - sEndpoint: ' + sEndpoint);
            if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery() - sParameter: ' + sParameter);       
            
            oRequest.setEndpoint(oJWTConn.instanceUrl + sEndpoint + sParameter);            
            
            HttpResponse oResponse = oHttp.send(oRequest);

            if(oResponse.getStatusCode() == 200 || oResponse.getStatusCode() == 201) {
                sResponse = oResponse.getBody();

                if(bDebug) system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromCalculatedInsightQuery - sResponse:' + sResponse);

                // Deserialize the JSON string into collections of primitive data types.
                Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(sResponse);
            }
        }
        return sResponse;
    }    
}