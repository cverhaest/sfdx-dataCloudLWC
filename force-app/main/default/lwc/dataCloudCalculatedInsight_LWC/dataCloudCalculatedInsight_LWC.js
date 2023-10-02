import { LightningElement, api, wire, track } from 'lwc';
import getDataCloudDataFromCalculatedInsightQueryResult from '@salesforce/apex/dataCloud_CTRL.getDataCloudDataFromCalculatedInsightQuery';
import { refreshApex } from '@salesforce/apex';

export default class DataCloudCalculatedInsight_LWC extends LightningElement {
    // Public Properties / Public Reactive Properties
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.reactivity_public
    @api title;
    @api iconName;
    @api variant;
    @api calculatedInsightname;
    @api measures = null;
    @api dimensions = null;
    @api filters = null;
    @api filterFieldName = null;
    @api batchSize = null;
    @api orderby = null;
    @api displayFieldLabels = false;
    @api fieldLabelsToDisplay = null;
    @api debug = false;

    // Expose a field to make it available in the template
    @track fieldLabels = [];
    @track finalTitle;
   
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

    rowCount = 0;

    @wire(getDataCloudDataFromCalculatedInsightQueryResult, 
        { 
            sRecordId : '$recordId',
            sObjectName : '$objectApiName',
            sCalculatedInsightname : '$calculatedInsightname',
            sMeasures : '$measures',
            sDimensions : '$dimensions',
            sFilters : '$filters',
            sFilterFieldName : '$filterFieldName',
            iBatchSize : '$batchSize',
            sOrderby : '$orderby',
            bDebug : '$debug'
        }
    )
    wiredGetDataCloudDataFromCalculatedInsightQueryFct(result) {
        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - START');
        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - result:' + JSON.stringify(result));

        this.lData = [];

        /*if(this.displayStyle === 'Table'){
            console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - Table display style');
            this.bDisplayTable = true;
        }*/

        this.wiredDataCloudResult = result;

        if(result.data) {
            if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - result.data:' + JSON.stringify(result.data));
            
            this.parsedValue = JSON.parse(result.data);
            if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - this.parsedValue:' + JSON.stringify(this.parsedValue));
            
            var lDataTemp = this.parsedValue.data;
            if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - lDataTemp:' + JSON.stringify(lDataTemp));

            this.rowCount = lDataTemp.length;
            if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - this.rowCount:' + this.rowCount);

            this.finalTitle = this.title + ' (' + this.rowCount + ')';

            // Field Labels Management
            if(this.displayFieldLabels && this.fieldLabelsToDisplay != null){
                //const fieldLabelsList = this.fieldLabelsToDisplay.replace(/\s+/g, '').split(',');
                const fieldLabelsList = this.fieldLabelsToDisplay.split(',');
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - fieldLabelsList.length:' + fieldLabelsList.length);
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - fieldLabelsList:' + JSON.stringify(fieldLabelsList));
            
                for(var i=0; i<fieldLabelsList.length; i++){
                    this.fieldLabels.push(fieldLabelsList[i]);
                }
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - fieldLabels:' + JSON.stringify(this.fieldLabels));
            }

            for (var property1 in lDataTemp) {
                var val1 = lDataTemp[property1];
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - property1: ' + property1 + ', val1: ' + val1);

                var rows = [];
                var j = 0;

                for (var property2 in val1) {
                    var val2 = val1[property2];
                    if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - property2: ' + property2 + ', val2: ' + val2);

                    var name = '';

                    if(this.fieldLabels[j] != null){
                        name = this.fieldLabels[j];
                    }
                    else{
                        name = property2;
                    }
                    if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - name: ' + name + ' - this.dimensions:' + this.dimensions);

                    var objTemp = {'name': name,'value': val2};
                    if(property2 == this.dimensions && this.rowCount == 1){
                    }
                    else
                        rows.push(objTemp);

                    j++;
                }
                this.lData.push(rows);    
            }
            if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - this.lData:' + JSON.stringify(this.lData));

        }else if (result.error) {
            this.error = result.error;
        }
        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - END');
    }

    connectedCallback() {
        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - connectedCallback() - START');
        
        // Card title management
        this.finalTitle = this.title;

        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - connectedCallback() - END');
    }   

    // Refresh the Cache
    // https://developer.salesforce.com/docs/component-library/documentation/lwc/lwc.apex
    handleRefresh(e) {
        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - handleRefresh() - START');

        return refreshApex(this.wiredDataCloudResult);
    }        
}