public with sharing class dataCloud_CTRL {
    @AuraEnabled(cacheable=true)
    public static String getDataCloudDataFromSQLQuery(String sRecordId, String sObjectName, String sQuery) {
        system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sQuery:' + sQuery);

        // Get Current Record information
        String sUnified_Individual_Id = [SELECT Id, Unified_Individual_Id__pc FROM Account WHERE Id = :sRecordId LIMIT 1].Unified_Individual_Id__pc;
        system.debug('### CVER - dataCloud_CTRL - getDataCloudDataFromSQLQuery - sUnified_Individual_Id:' + sUnified_Individual_Id);

        String sResponse = '';
        
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
            
            if(sQuery.contains('###Unified_Individual_Id###')){
                sQuery = sQuery.replace('###Unified_Individual_Id###', '\'' + sUnified_Individual_Id + '\'');
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