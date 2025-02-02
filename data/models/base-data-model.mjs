export class MenaceXBaseDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
		const {FilePathField, StringField, ArrayField, SchemaField, NumberField, BooleanField} = foundry.data.fields;

        return {
            level:new SchemaField({
                value:new NumberField({initial:1})
            }),
            xp:new SchemaField({
                value:new NumberField({initial:2}),
                max:new NumberField({initial:2}),
            }),
            alert:new SchemaField({
                type:new StringField({initial:"error"}),
                msg:new StringField({initial:""})
            }),
            capacities:new ArrayField(new SchemaField({
                img:new FilePathField({categories: ["IMAGE"]}),
                id:new StringField({initial:''}),
                name:new StringField({initial:''}),
                std:new BooleanField({initial:true}),
                system:new SchemaField({
                    rank:new NumberField({initial:0}),
                    description:new StringField({initial:''}),
                })
            }))
        }
    }

    get items() {
        return this.parent.items;
    }

    get path() {
        return this.items.filter(itm => itm.type === 'path');
    }

    prepareBaseData() {}

    prepareDerivedData() {}
}