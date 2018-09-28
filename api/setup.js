async function customFieldDefinitionExists(hyperion, internalName, objectType) {
    let definitionsList = hyperion.dbx.CustomField.Definition.Lists.at(objectType);

    return definitionsList && await hyperion.algorithm.find(hyperion.dbx.using(definitionsList))
        .where(function (obj) {
            return obj.InternalName === internalName;
        });
}

async function setupCustomFieldDefinitions(hyperion, objectType, definitionsList) {
    definitionsList.forEach(async (element) => {
        let customFieldDefExists = await customFieldDefinitionExists(hyperion, element.internalName, objectType);    
        // if the custom field definition is already defined, do not attempt to create it again
        if(customFieldDefExists)
            return;

        // create a new Custom Field Definition
        let newCustomFieldDef = new hyperion.dbx.DbClass.CustomFieldDefinition();
        newCustomFieldDef.Type = element.type;
        newCustomFieldDef.ObjectType = objectType;
        newCustomFieldDef.InternalName = element.internalName;
        newCustomFieldDef.DisplayName = element.name;
        // can only be written from API
        newCustomFieldDef.IsReadOnly = true;
        if (element.defaultValue) {
            newCustomFieldDef.DefaultValue = element.defaultValue;
        }
        
        // Call this method to persist the object in the database, otherwise it won't be saved
        hyperion.dbx.save(newCustomFieldDef); 
    });
}

async function setupWarehouseReceipt(hyperion) {
    const customFields = [
        {
            internalName : 'test_from_api',
            name : 'Test from API',
            type : hyperion.dbx.CustomField.Definition.DataType.String
        }
    ];
    
    // object type the supports custom fields in Magaya
    const objectType = hyperion.dbx.Common.DbClassType.WarehouseReceipt;
    await setupCustomFieldDefinitions(hyperion, objectType, customFields);
}

async function setupInvoices(hyperion) {
    const customFields = [
        {
            internalName : 'ready_to_transmit',
            name : 'Ready to Transmit',
            type : hyperion.dbx.CustomField.Definition.DataType.Boolean,
            defaultValue : false
        },
        {
            internalName : 'transmitted',
            name : 'Transmitted',
            type : hyperion.dbx.CustomField.Definition.DataType.Boolean,
            defaultValue : false
        },
        {
            internalName : 'last_process_date',
            name : 'Last process date',
            type : hyperion.dbx.CustomField.Definition.DataType.DateTime
        }
    ];
    
    // object type the supports custom fields in Magaya
    const objectType = hyperion.dbx.Common.DbClassType.Invoice;
    await setupCustomFieldDefinitions(hyperion, objectType, customFields);
}

module.exports = {
    createCustomFieldDefinitions : async (hyperion) => {
        try {
            await setupWarehouseReceipt(hyperion);

            await setupInvoices(hyperion);
        }
        catch (ex) { 
            console.log(ex);
        }
    }
};