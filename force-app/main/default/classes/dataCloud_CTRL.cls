public with sharing class dataCloud_CTRL {
    @AuraEnabled(cacheable=true)
    public static String getDataCloudDataFromSQLQuery(String sRecordId, String sObjectName, String sQuery, String sFilterFieldName) {
        system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sRecordId:' + sRecordId + '- sObjectName:' + sObjectName + ' - sQuery:' + sQuery + '- sFilterFieldName:' + sFilterFieldName);
        
        String sResponse = '';
        String sQueryCurrentRecord = '';
        String sFilterFieldValue = '';

        if(sFilterFieldName != null && sFilterFieldName != ''){
            // Get Current Record information based on filterFieldName
            sQueryCurrentRecord = 'SELECT Id, ' + sFilterFieldName + ' FROM Account WHERE Id = \'' + sRecordId +  '\' LIMIT 1';
            system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sQueryCurrentRecord:' + sQueryCurrentRecord);

            sObject oCurrentRecord = Database.query(sQueryCurrentRecord);
            system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - oCurrentRecord:' + oCurrentRecord);

            if(oCurrentRecord != null){
                sFilterFieldValue = (String) oCurrentRecord.get(sFilterFieldName);
                system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sFilterFieldValue:' + sFilterFieldValue);
            }
        }

        if(sQuery != null && sQuery != ''){ 
            Http oHttp = new Http();
            HttpRequest oRequest = new HttpRequest();    
            
            // OAuth JWT Bearer
            // Recover username of the current user in the other org
            OAuth_JWTBearer_Connection oJWTConn = new OAuth_JWTBearer_Connection('DataCloud', null);
            system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery() - accessCode: ' + oJWTConn.accessCode.substring(0, 15));
            system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery() - instanceUrl: ' + oJWTConn.instanceUrl);       
            
            oRequest.setEndpoint(oJWTConn.instanceUrl + '/services/data/v58.0/ssot/query');
            oRequest.setHeader('Authorization', 'Bearer ' + oJWTConn.accessCode);
            oRequest.setHeader('Content-Type', 'application/json');
            oRequest.setMethod('POST');
            oRequest.setTimeout(120000);
            
            if(sQuery.contains('###FilterFieldValue###')){
                sQuery = sQuery.replace('###FilterFieldValue###', '\'' + sFilterFieldValue + '\'');
            }
            String sqlQueryJSON = '{ "sql" : "' + sQuery + '"}';

            system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery() - sqlQueryJSON: ' + sqlQueryJSON);       
            
            oRequest.setBody(sqlQueryJSON);

            HttpResponse oResponse = oHttp.send(oRequest);

            if(oResponse.getStatusCode() == 200 || oResponse.getStatusCode() == 201) {
                sResponse = oResponse.getBody();

                system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sResponse:' + sResponse);

                // Deserialize the JSON string into collections of primitive data types.
                Map<String, Object> results = (Map<String, Object>) JSON.deserializeUntyped(sResponse);
            }
        }
        return sResponse;
    }
}