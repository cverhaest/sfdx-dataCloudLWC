import { LightningElement, api, wire, track } from 'lwc';
import getDataCloudDataFromSQLQueryResult from '@salesforce/apex/dataCloud_CTRL.getDataCloudDataFromSQLQuery';
import { refreshApex } from '@salesforce/apex';

export default class DataCloud_LWC extends LightningElement {
    // Public Properties / Public Reactive Properties
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.reactivity_public
    @api title;
    @api displayStyle;
    @api sqlQuery;
    @api filterFieldName;
    @api displayFieldLabels = false;
    @api fieldLabelsToDisplay;
    @api debug = false;
    bDisplayTable = false;

    // Expose a field to make it available in the template
    @track fieldLabels = [];
   
    // Make a Component Aware of Its Record Context
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.use_record_context
    @api recordId;
    
    // Make a Component Aware of Its Object Context
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.use_object_context
    @api objectApiName;

    // Tracked Properties / Private Reactive Properties
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.js_props_private_reactive
    @track error;
    @track lData = [];

    // Call Apex Methods - Wire an Apex Method to a Function
    // To use @wire to call an Apex method, you must set cacheable=true.
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.apex
    // Render Lists
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.create_lists
    wiredDataCloudResult = [{}];

    rowCount;
    /*ssot__Salutation__c;
    ssot__FirstName__c;
    ssot__LastName__c;
    ssot__PersonName__c;
    ssot__Id__c;
    MDMId__c;
    ssot__BirthDate__c;*/

    @wire(getDataCloudDataFromSQLQueryResult, 
        { 
            sRecordId : '$recordId',
            sObjectName : '$objectApiName',
            sQuery : '$sqlQuery',
            sFilterFieldName : '$filterFieldName'
        }
    )
    wiredGetDataCloudDataFromSQLQueryResultFct(result) {
        if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - START - sqlQuery:'+ this.sqlQuery);
        if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - result:' + JSON.stringify(result));

        if(this.displayStyle === 'Table'){
            console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - Table display style');
            this.bDisplayTable = true;
        }

        this.wiredDataCloudResult = result;

        if(result.data) {
            if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - result.data:' + JSON.stringify(result.data));
            
            this.parsedValue = JSON.parse(result.data);
            if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - this.parsedValue:' + JSON.stringify(this.parsedValue));
            
            this.rowCount = this.parsedValue.rowCount;
            if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - this.rowCount:' + this.rowCount);

            var lDataTemp = this.parsedValue.data;
            if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - lDataTemp:' + JSON.stringify(lDataTemp));
            if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - lDataTemp.length:' + lDataTemp.length);

            // Field Labels Management
            if(this.displayFieldLabels && this.fieldLabelsToDisplay != null){
                //const fieldLabelsList = this.fieldLabelsToDisplay.replace(/\s+/g, '').split(',');
                const fieldLabelsList = this.fieldLabelsToDisplay.split(',');
                if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - fieldLabelsList.length:' + fieldLabelsList.length);
                if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - fieldLabelsList:' + JSON.stringify(fieldLabelsList));
            
                for(var i=0; i<fieldLabelsList.length; i++){
                    this.fieldLabels.push(fieldLabelsList[i]);
                }
                if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - fieldLabels:' + JSON.stringify(this.fieldLabels));
            }

            for (var property1 in lDataTemp) {
                var val1 = lDataTemp[property1];
                if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - property1: ' + property1 + ', val1: ' + val1);

                var rows = [];
                var j = 0;

                for (var property2 in val1) {
                    var val2 = val1[property2];
                    if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - property2: ' + property2 + ', val2: ' + val2);

                    var name = '';

                    if(this.fieldLabels[j] != null){
                        name = this.fieldLabels[j];
                    }
                    else{
                        name = property2;
                    }
                    if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - name: ' + name);

                    var objTemp = {'name': name,'value': val2};
                    rows.push(objTemp);

                    j++;
                }
                this.lData.push(rows);    
            }
            if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - this.lData:' + JSON.stringify(this.lData));

            /*this.ssot__Salutation__c = this.parsedValue.data[0].ssot__Salutation__c;
            this.ssot__FirstName__c = this.parsedValue.data[0].ssot__FirstName__c;
            this.ssot__LastName__c = this.parsedValue.data[0].ssot__LastName__c;
            this.ssot__PersonName__c = this.parsedValue.data[0].ssot__PersonName__c;
            if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - ssot__PersonName__c:' + this.ssot__PersonName__c);

            this.ssot__Id__c = this.parsedValue.data[0].ssot__Id__c;
            this.MDMId__c = this.parsedValue.data[0].MDMId__c;
            this.ssot__BirthDate__c = this.parsedValue.data[0].ssot__BirthDate__c;*/
        }else if (result.error) {
            this.error = result.error;
        }
        if(this.debug) console.log('### dataCloud_LWC - wiredGetDataCloudDataFromSQLQueryResultFct() - END');
    }

    // Refresh the Cache
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.apex
    handleRefresh(e) {
        if(this.debug) console.log('### dataCloud_LWC - handleRefresh() - START');

        return refreshApex(this.wiredDataCloudResult);
    }    
}