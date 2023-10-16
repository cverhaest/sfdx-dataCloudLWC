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
    @api measuresSymbolsToDisplay = null;
    @api dimensions = null;
    @api filters = null;
    @api filterFieldName = null;
    @api batchSize = null;
    @api orderby = null;
    @api displayFieldLabels = false;
    @api fieldLabelsToDisplay = null;
    @api displayRowCount = false;
    @api debug = false;

    // Expose a field to make it available in the template
    @track fieldLabels = [];
    @track measuresSymbols = [];
    @track dimensionsTable = [];
    @track finalTitle;
    @track gridElementValueClass = 'slds-m-right_xxx-small slds-col slds-text-align_center slds-text-heading_large slds-theme_shade';
    @track gridElementLabelClass = 'slds-m-right_xxx-small slds-col slds-text-align_center slds-form-element__label';
   
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

            this.finalTitle = this.title;
            if(this.displayRowCount) this.finalTitle += ' (' + this.rowCount + ')';

            // Dimensions Management
            if(this.dimensions != null){
                const dimensionsList = this.dimensions.split(',');
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - dimensionsList.length:' + dimensionsList.length);
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - dimensionsList:' + JSON.stringify(dimensionsList));
            
                for(var i=0; i<dimensionsList.length; i++){
                    this.dimensionsTable.push(dimensionsList[i]);
                }
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - dimensionsTable:' + JSON.stringify(this.dimensionsTable));
            }

            // Grid Element Class Management
            if(this.measures != null){
                const measuresList = this.measures.split(',');
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - measuresList.length:' + measuresList.length);
                
                this.gridElementValueClass += ' slds-size_' + 12/measuresList.length + '-of-12';
                this.gridElementLabelClass += ' slds-size_' + 12/measuresList.length + '-of-12';
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - gridElementValueClass:' + this.gridElementValueClass);
            }

            // Measures Symbols & Grid Element Class Management
            if(this.measuresSymbolsToDisplay != null){
                const measuresSymbolsList = this.measuresSymbolsToDisplay.split(',');
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - measuresSymbolsList.length:' + measuresSymbolsList.length);
                if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - measuresSymbolsList:' + JSON.stringify(measuresSymbolsList));
            
                for(var i=0; i<measuresSymbolsList.length; i++){
                    this.measuresSymbols.push(measuresSymbolsList[i]);
                }
            }

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
                var k = 0;

                for (var property2 in val1) {
                    if(this.dimensionsTable.includes(property2) && this.rowCount == 1){
                        // Calculated Insight Query API response also contains dimensions information
                    }
                    else{
                        var val2 = val1[property2];

                        if(this.measuresSymbols[k] != null){
                            val2 += this.measuresSymbols[k];
                        }
                        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - property2: ' + property2 + ', val2: ' + val2);

                        var name = '';

                        if(this.fieldLabels[k] != null){
                            name = this.fieldLabels[k];
                        }
                        else{
                            name = property2;
                        }
                        if(this.debug) console.log('### DataCloudCalculatedInsight_LWC - wiredGetDataCloudDataFromCalculatedInsightQueryFct() - name: ' + name + ' - this.dimensions:' + this.dimensions);

                        var objTemp = {'name': name,'value': val2};
                        rows.push(objTemp);

                        k++;
                    } 

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