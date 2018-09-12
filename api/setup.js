
module.exports = {
    createCustomFieldDefinitions : async (hyperion) => {
        try {
            const internalName = 'test_from_api';
            // object type the supports custom fields in Magaya
            const objectType = hyperion.dbx.Common.DbClassType.WarehouseReceipt;
            // obtain the current list of custom fields for that type
            let definitionsList = hyperion.dbx.CustomField.Definition.Lists.at(objectType);

            const customFieldDefExists = definitionsList && await hyperion.algorithm.find(hyperion.dbx.using(definitionsList))
            .where(function (obj) {
                return obj.InternalName === internalName;
            });
            
            // if the custom field definition is already defined, do not attempt to create it again
            if(customFieldDefExists)
                return;
        
            // create a new Custom Field Definition
            let newCustomFieldDef = new hyperion.dbx.DbClass.CustomFieldDefinition();
            newCustomFieldDef.Type = hyperion.dbx.CustomField.Definition.DataType.String;
            newCustomFieldDef.ObjectType = objectType;
            newCustomFieldDef.InternalName = internalName;
            newCustomFieldDef.DisplayName = 'Test from API';
            // can only be written from API
            newCustomFieldDef.IsReadOnly = true;
            
            // Call this method to persist the object in the database, otherwise it won't be saved
            hyperion.dbx.save(newCustomFieldDef); 
        }
        catch (ex) { 
            console.log(ex);
        }
    }
};