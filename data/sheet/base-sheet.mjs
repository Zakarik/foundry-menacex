import { Path } from "../../../../systems/coc/module/controllers/path.js";
import { Capacity } from "../../../../systems/coc/module/controllers/capacity.js";

export class MenaceXBaseActorSheet extends ActorSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hp", "sheet", "actor", "menacexbase"],
      template: "modules/foundry-menacex/data/templates/base-sheet.html",
      width: 1200,
      height: 720,
      tabs: [
        {navSelector: ".sheet-tabs", contentSelector: ".body", initial: "personnage"},
      ],
      dragDrop: [{dragSelector: null, dropSelector: null}],
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options = {}) {
    const data = await super.getData(options);
    const actorData = this.actor.toObject(false);
    const paths = actorData.items.filter(item => item.type === "path");
    data.paths = paths;
    data.pathCount = data.paths.length;
    data.capacities = {
        count: actorData.items.filter(item => item.type === "capacity").length+actorData.items.filter(itm => itm.type === 'path').length,
        collections: []
    }
    data.capacities.collections.push({
        id: "standalone-capacities",
        label: "Capacités Hors-Voies",
        items: Object.values(actorData.items).filter(item => {
            if (item.type === "capacity" && item.system.path.key === "") {
                return true;
            }
        }).sort((a, b) => (a.name > b.name) ? 1 : -1)
    });
    for (const path of paths) {      
        data.capacities.collections.push({
            id: (path.system.key) ? path.system.key : path.name.slugify({ strict: true }),
            label: path.name,
            items: actorData.system.capacities.filter(itm => itm.id === path._id).concat(Object.values(actorData.items).filter(item => {
                if (item.type === "capacity" && item.system.path._id === path._id) return true;
            })).sort((a, b) => (a.system.rank > b.system.rank) ? 1 : -1)
        });
    }
    data.items = actorData.items;
    for ( let i of actorData.items ) {
        const item = this.actor.items.get(i._id);
        i.labels = item.labels;
    }
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Labels and filters
    data.labels = this.actor.labels || {};

    let listCapacities = this.actor.system.capacities

    for(let c of listCapacities) {
      if(!paths.filter(itm => itm._id === c.id).length) listCapacities = listCapacities.filter(itm => itm.id !== c.id)
    }

    if(listCapacities !== this.actor.system.capacities) this.actor.update({['system.capacities']:listCapacities});

    return data;
  }

  /**
     * Return a light sheet if in "limited" state
     * @override
     */
    get template() {

    return this.options.template;
  }
  
  /** @inheritdoc */
  activateListeners(html) {
      super.activateListeners(html);
      html.find(".item-edit").click(this._onEditItem.bind(this));
      html.find(".item-delete").click(this._onDeleteItem.bind(this));

      // Check/Uncheck capacities
      html.find(".capacity-checked").click((ev) => {
        ev.preventDefault();
        return this._onCheckedCapacity(this.actor, ev, true);
      });
      html.find(".capacity-unchecked").click((ev) => {
        ev.preventDefault();
        return this._onCheckedCapacity(this.actor, ev, false);
      });
      html.find(".capacity-create").click((ev) => {
        ev.preventDefault();
        return Capacity.create(this.actor, ev);
      });
      html.find(".capacity-toggle").click((ev) => {
        ev.preventDefault();
        const li = $(ev.currentTarget).closest(".capacity");
        li.find(".capacity-description").slideToggle(200);
      });
  }

  /* -------------------------------------------- */
  /* DROP EVENTS CALLBACKS                        */
  /* -------------------------------------------- */

  /** @override */
  async _onDrop(event) {
    event.preventDefault();
    // Get dropped data
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }
    if (!data) return false;
    if (data.type === "Item") {
      return this._onDropItem(event, data);
    }
    if (data.type === "Actor") {
      return false;
    }
  }

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Object}             OwnedItem data to create
   * @private
   */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;

    const item = await Item.fromDropData(data);
    const itemData = foundry.utils.duplicate(item);

    if(item.type !== 'path') return;

    switch (itemData.type) {
      case "path":
        const add = await Path.addToActor(this.actor, item);
        this.actor.system.capacities.push({          
          img:add[0].img,
          id:add[0]._id,
          name:"",
          std:true,
          system:{
              description:'',
              rank:0,
          }    
        });

        console.warn(add);
        console.warn(this.actor.system.capacities);

        this.actor.update({[`system.capacities`]:this.actor.system.capacities});

        return add;
      default: {
        // Handle item sorting within the same Actor
        const actor = this.actor;
        let sameActor = item.actor?.id === actor.id && ((!actor.isToken && !data.tokenId) || data.tokenId === actor.token.id);
        if (sameActor) return this._onSortItem(event, itemData);

        // On force le nouvel Item a ne pas être équipé (notamment lors du transfert d'un inventaire à un autre)
        if (itemData.system.worn) itemData.system.worn = false;

        // Create the owned item
        return this.actor.createEmbeddedDocuments("Item", [itemData]).then(async () => {
          // Si il n'y as pas d'actor id, il s'agit d'un objet du compendium, on quitte
          if (!item.actor) return item;

          // Si l'item doit être "move", on le supprime de l'actor précédent
          let moveItem = game.settings.get("coc", "moveItem");
          if (moveItem ^ event.shiftKey) {
            const originalActor = (await fromUuid(data.uuid)).actor;
            originalActor.deleteEmbeddedDocuments("Item", [item.id]);
          }
        });
      }
    }
  }

  /**
   * Callback on render item actions
   * @param event
   * @private
   */
  _onEditItem(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const id = li.data("itemId");
    const type = li.data("itemType") ? li.data("itemType") : "item";
    const uuid = li.data("uuid");

    if (type === "effect") {
      let effects = this.actor.effects;
      const effect = effects.get(id);
      if (effect) {
        return new ActiveEffectConfig(effect).render(true);
      } else return false;
    } else if (type === "capacity") {
      // Recherche d'un capacité existante avec la même clé
      const key = li.data("key");
      let entity = this.actor.items.find((i) => i.type === "capacity" && i.system.key === key);
      return entity ? entity.sheet.render(true) : fromUuid(uuid).then((e) => e.sheet.render(true));
    } else {
      // Look first in actor embedded items
      let item = this.actor.items.get(id);      
      if (item) return item.sheet.render(true);
      // If not found, use the uuid to find the item
      item = fromUuidSync(uuid);
      if (item) return item.sheet.render(true);
      // If not found, look in the world items
      item = game.items.get(id);
      if (item) return item.sheet.render(true);
    }
  }

  /* -------------------------------------------- */
  /* DELETE EVENTS CALLBACKS                      */
  /* -------------------------------------------- */

  /**
   * Callback on delete item actions
   * @param event the roll event
   * @private
   */

  _onDeleteItem(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    let itemId = li.data("itemId");
    const entity = this.actor.items.find((item) => item.id === itemId);
    itemId = itemId instanceof Array ? itemId : [itemId];
    switch (entity.type) {
      case "capacity":
        return Capacity.removeFromActor(this.actor, entity);
      case "path":
        return Path.removeFromActor(this.actor, entity);
      case "profile":
        return Profile.removeFromActor(this.actor, entity);
      default:
        return this.actor.deleteEmbeddedDocuments("Item", itemId);
    }
  }
  
  /**
   * @name _onCheckedCapacity
   * @description Evènement sur la case à cocher d'une capacité dans la partie voie
   * @param {CofActor} actor l'acteur
   * @param {Event} event l'évènement
   * @param {boolean} isUncheck la capacité est décochée
   * @returns l'acteur modifié
   * @private
   */
  _onCheckedCapacity(actor, event, isUncheck) {
    const elt = $(event.currentTarget).parents(".capacity");
    // get id of clicked capacity
    const capId = elt.data("itemId");
    // get id of parent path
    const pathId = elt.data("pathId");

    return Capacity.toggleCheck(actor, capId, pathId, isUncheck);
  }
}