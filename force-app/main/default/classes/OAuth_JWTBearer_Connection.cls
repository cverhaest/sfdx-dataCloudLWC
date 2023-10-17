/*------------------------------------------------------------------------
 * Author:        Cyril Verhaest
 * Company:       Salesforce.com
 * Description:   Utility class to request a session from an external org
 *                using the OAuth JWT Bearer Token flow. Class constructs
 *                the token, signs with a shared cert & posts via a HTTP 
 *                Request.  
 * 
 *              - Requires a Remote Site Setting for the external Org URL. 
 *              - Requires a Connected App configured on the external org
 *              - Requires a shared digital certificate (created in this 
 *                org, loaded against the Connected App in the external org
 *              - Requires the user to be pre-authorised for the connected app
 *
 * Test Class:    OAuth_JWTBearer_Connection_Test
 * 
 * History
 * 2018-MARCH-20     Cyril Verhaest     Created
--------------------------------------------------------------------------*/
public class OAuth_JWTBearer_Connection {

    public String accessCode {get; private set;}
    public String instanceUrl {get; private set;}

    private String client_id;
    private String user_name;
    private String login_url;
    private String cert_name;

    /* Constructor retrieving org details from custom settings */
    public OAuth_JWTBearer_Connection(String orgName, String username) {

        // retrieve settings from custom metadata
        JWTBearerCM__mdt conn_settings = [SELECT Client_Id__c, Default_User__c, Login_Url__c ,Cert_Name__c FROM JWTBearerCM__mdt WHERE MasterLabel =: + orgName LIMIT 1][0];

        this.client_id = conn_settings.Client_Id__c;
        this.user_name = username!=null?username:conn_settings.Default_User__c;
        this.login_url = conn_settings.Login_Url__c;
        this.cert_name = conn_settings.Cert_Name__c;

        requestAccessToken();
    }

    /* Standard constructor
     * Connection is attempted on construction of the class
     * Input variables: 
     *    clientId = OAuth Client Id for Connected App in external Org
     *    userName = Any user pre-authorised to login through connected app
     *    loginUrl = Root URL for external Org (usually https://login.salesforce.com or 
     *               https://test.salesforce.com). A Remote Site Setting must exist for this URL. 
     *    certName = Name of the digital Certificate (self-signed or CA) in the certificate store used
     *               to authenticate the request. This needs to be loaded against the connected app in 
     *               the external org
     */
    public OAuth_JWTBearer_Connection(String clientId, String username, String loginUrl, String certName) {

        this.client_id = clientId;
        this.user_name = username;
        this.login_url = loginUrl;
        this.cert_name = certName;
        
        requestAccessToken();
    }


    /* Callout to get OAuth Access Token
     * Requires the login_url to be declared in an active Remote Site Setting
     */
    private void requestAccessToken() {
       
        try {
            // Instantiate a new HTTP request
            HttpRequest req = new HttpRequest();
            req.setEndpoint(login_url + '/services/oauth2/token');
            req.setMethod('POST');
           
            req.setBody('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + JWTBearerToken());
           
            // Send the request
            Http h = new Http();
            HttpResponse res = h.send(req);
           
            system.debug('### res.getStatusCode(): ' + res.getStatusCode());
            system.debug('### res.getBody(): ' + res.getBody());
           
            if (res.getStatusCode() == 200) {
                // parse the response for success
                JSONParser parser = JSON.createParser(res.getBody());
                while (parser.nextToken() != null) {
                    String fieldName = parser.getCurrentName();
                    if ('access_token' == fieldName) accessCode = parser.getText();
                    if ('instance_url' == fieldName) instanceUrl = parser.getText();
                }          
            } else {
                system.debug('### Callout failed: ' + res.toString());
                throw new OAuthException('### Callout failed: ' + res.toString());
            }
            if (accessCode == null || accessCode.length() == 0) {
                throw new OAuthException('No access token returned: ' + res.toString());
            }
            
            // https://salesforce.stackexchange.com/questions/179845/session-id-remove-issue-in-api-callouts-in-salesforce
            system.debug('### accessCode: ' + accessCode.substring(0,15));
            system.debug('### instance Url: ' + instanceUrl);

        } catch (Exception e) {
            OAuthException ex = new OAuthException(String.format('Failed to establish external session for {0} at {1} with certificate {2}. {3}',
                                                   new String[] {this.user_name, this.login_url, this.cert_name, e.getMessage()}));
            ex.initCause(e); 
            throw (ex);
        }

    }
   
    /* Construct BearerToken
    /* The issuer (iss) must be the OAuth client_id of the connected app for which the developer registered their certificate.
     * The audience (aud) must be https://login.salesforce.com or https://test.salesforce.com.
     * The principal (prn) must be the username of the desired Salesforce user.      * The validity (exp) must be the expiration time of the assertion, within five minutes, expressed as the number of seconds from 1970-01-01T0:0:0Z measured in UTC.
     */
    private String JWTBearerToken() {
       
        String token;

        // Construct a JWT Header in the following format: {"alg":"RS256"}
        String header = '{"alg":"RS256"}';
		System.debug('### header: ' + header);

        // Base64url encode the JWT Header as defined here: http://tools.ietf.org/html/rfc4648#page-7.
        String b64_header = base64urlEncode(Blob.valueOf(header));
		System.debug('### Base64url header: ' + b64_header);

        // Construct a JSON Claims Set for the JWT with the iss, prn, aud, and exp:
        JSONGenerator claims = JSON.createGenerator(false);

        String expiration_time = String.valueOf((System.currentTimeMillis()/1000 ) + 300);

        claims.writeStartObject();
        claims.writeStringField('iss', this.client_id);
        claims.writeStringField('prn', this.user_name);
        claims.writeStringField('aud', this.login_url);
        claims.writeStringField('exp', expiration_time);
        claims.writeEndObject();

        System.debug('### claims: ' + claims.getAsString());

        // Base64url encode the JWT Claims Set
        String b64_claims = base64urlEncode(Blob.valueOf(claims.getAsString()));
		System.debug('### Base64url claims: ' + b64_claims);

        // Create a new string for the encoded JWT Header and the encoded JWT Claims Set, in this format:
        //    encoded_JWT_Header + "." + encoded_JWT_Claims_Set
        token = b64_header + '.' + b64_claims;

        // Sign the resulting string using SHA256 with RSA
        Blob signature = Crypto.signWithCertificate('RSA-SHA256',
                                                    Blob.valueOf(token),
                                                    this.cert_name);
        System.debug('### signature: ' + signature);

        String b64_signature = base64urlEncode(signature);
        System.debug('### Base64url signature: ' + b64_signature);

        // Create a new string of the string from this step, in the following format:
        //   existing_string + "." + base64_encoded_signature
        token = token + '.' + b64_signature;
        System.debug('### token: ' + token);

        return token;
    }
   
    // Base64 encode with URL and Filename safe alphabet
    // http://tools.ietf.org/html/rfc4648#page-7
    private String base64urlEncode(Blob inputBlob) {      
        String b64 = EncodingUtil.base64Encode(inputBlob);
        String b64url = b64.replace('+', '-').replace('/', '_');
        return b64url;
    }

    public class OAuthException extends Exception {}

}