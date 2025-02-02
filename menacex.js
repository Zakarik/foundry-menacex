import { MenaceXBaseDataModel } from "./data/models/base-data-model.mjs";
import { MenaceXBaseActorSheet } from "./data/sheet/base-sheet.mjs";

const MODULE_ID = 'foundry-menacex'; // Change this ID!

Hooks.on('init', () => {
  Object.assign(CONFIG.Actor.dataModels, {
    "foundry-menacex.menacexbase":MenaceXBaseDataModel
  });
  Actors.registerSheet("foundry-menacex", MenaceXBaseActorSheet, {types: ["foundry-menacex.menacexbase"], makeDefault: false});

  libWrapper.register(MODULE_ID, "CONFIG.Actor.documentClass.prototype.computeAttacks", actor, "MIXED");
  libWrapper.register(MODULE_ID, "CONFIG.Actor.documentClass.prototype.computeMods", actor, "MIXED");
  libWrapper.register(MODULE_ID, "CONFIG.Actor.documentClass.prototype.computeDef", actor, "MIXED");
  //libWrapper.register(MODULE_ID, "CONFIG.Actor.documentClass.prototype.computeXP", actor, "MIXED");
  libWrapper.register(MODULE_ID, "CONFIG.Actor.documentClass.prototype.computeAttributes", actor, "MIXED");

  
  Handlebars.registerHelper('findCapacity', function (data, actor) {
    console.warn(actor.actor.system)
    const capacities = actor.data.system.capacities.findIndex(itm => itm.id === data.id);

    return capacities;
  });
});

Hooks.once('ready', async () => { 
  libWrapper.register(MODULE_ID, "CONFIG.Actor.sheetClasses.character['coc.CoCActorSheet'].cls.prototype._render", actorSheet_render, "WRAPPER");
  libWrapper.register(MODULE_ID, "CONFIG.Actor.sheetClasses.npc['coc.CoCNpcSheet'].cls.prototype._render", actorSheet_render, "WRAPPER");
  libWrapper.register(MODULE_ID, "CONFIG.Actor.sheetClasses.encounter['coc.CoCEncounterSheet'].cls.prototype._render", encounterSheet_render, "WRAPPER");
});

async function actorSheet_render(wrapped, ...args) {
  await wrapped(...args);
  if (!this.actor.isOwner) return;
  const sectionPT = this.element[0]?.querySelector(`div.tab.stats > div.flexrow:last-of-type div.flex1:last-of-type`);
  const sectionDEF = this.element[0]?.querySelector(`div.tab.stats > div.flexrow div.flexrow.defence`);

  // POINTS DE TENSIONS
  if(!sectionPT) return;
  //HEADER
  const headerTemplate = Handlebars.compile(`
    <div class="flexrow table-header injuries-header no-wrap">
      <div class="flex2 center">
        <div class="field-label ellipsis">{{ptLabel}}</div>
      </div>
      <div class="flex3 center">
        <div class="field-label">{{valueLabel}}</div>
      </div>
    </div>
  `);

  const mainFirstDivHTML = headerTemplate({
    ptLabel: game.i18n.localize("MENACEX.pt"),
    valueLabel: game.i18n.localize("COC.ui.value")
  });
  sectionPT.innerHTML += mainFirstDivHTML;
  
  //BODY
  const bodyPTTemplate = Handlebars.compile(`
    <div class="flexrow injuries no-wrap">
      <div class="flex2 center cell-header">
        <span class="field-label ellipsis">
          <i class="fas fa-skull"></i> {{ptShortLabel}}
        </span>
      </div>
      <div class="flex3 center cell">
        <input class="field-value" name="system.attributes.pt.value" type="text" value="{{value}}" placeholder="{{valueLabel}}" data-dtype="Number">
      </div>
    </div>
  `);

  const mainSecondDivHTML = bodyPTTemplate({
    ptShortLabel: game.i18n.localize("MENACEX.pt-short"),
    value:this.actor.system.attributes?.pt?.value ?? 0,
    valueLabel: game.i18n.localize("COC.ui.value")
  });
  sectionPT.innerHTML += mainSecondDivHTML;

  // DEF PSI
  
  if(!sectionDEF) return;
  // BODY
  const bodyDefTemplate = Handlebars.compile(
    `<div class="flexrow no-wrap defence">
      <div class="flex6 center cell-header">
          <span class="field-label"><i class="fas fa-shield-alt"></i> {{defShortLabel}}</span>
      </div>
      <div class="flex5 center cell">
          <input class="field-value" name="system.attributes.defpsi.base" type="text" value="{{base}}" placeholder="Base" data-dtype="Number">
      </div>
      <div class="flex5 center cell">
          <input class="field-value" name="system.attributes.defpsi.bonus" type="text" value="{{bonus}}" placeholder="Bonus" data-dtype="Number">
      </div>
      <div class="flex6 center cell readonly">
          <input class="field-value" name="system.attributes.defpsi.value" readonly="true" type="text" value="{{value}}" placeholder="Value" data-dtype="Number">
      </div>
    </div>`
  );
  const base = 10;
  const bonus = parseInt(this.actor.system.attributes?.defpsi?.bonus ?? 0);
  const charisme = parseInt(this.actor.system.stats.cha.mod);
  const atkPsi = parseInt(this.actor.system.attacks.magic.mod);

  const mainDefPsi = bodyDefTemplate({
    defShortLabel: game.i18n.localize('MENACEX.def-short'),
    value:base+bonus+charisme+atkPsi,
    base:base,
    bonus:bonus,
    valueLabel: game.i18n.localize("COC.ui.value")
  });
  sectionDEF.insertAdjacentHTML('afterend', mainDefPsi);


};

async function encounterSheet_render(wrapped, ...args) {
  await wrapped(...args);
  if (!this.actor.isOwner) return;
  const sectionDEF = this.element[0]?.querySelector(`div.tab.stats div.defence`);
  
  // DEF PSI
  if(!sectionDEF) return;
  // BODY
  const bodyDefTemplate = Handlebars.compile(
    `<div class="flexrow no-wrap defence">
      <div class="flex6 center cell-header">
          <span class="field-label"><i class="fas fa-shield-alt"></i> {{defShortLabel}}</span>
      </div>
      <div class="flex5 center cell">
          <input class="field-value" name="system.attributes.defpsi.base" type="text" value="{{base}}" placeholder="Base" data-dtype="Number">
      </div>
      <div class="flex5 center cell">
          <input class="field-value" name="system.attributes.defpsi.bonus" type="text" value="{{bonus}}" placeholder="Bonus" data-dtype="Number">
      </div>
      <div class="flex6 center cell readonly">
          <input class="field-value" name="system.attributes.defpsi.value" readonly="true" type="text" value="{{value}}" placeholder="Value" data-dtype="Number">
      </div>
    </div>`
  );
  const base = 10;
  const bonus = parseInt(this.actor.system.attributes?.defpsi?.bonus ?? 0);
  const charisme = parseInt(this.actor.system.stats.cha.mod);
  const atkPsi = parseInt(this.actor.system.attacks.magic.mod);

  const mainDefPsi = bodyDefTemplate({
    defShortLabel: game.i18n.localize('MENACEX.def-short'),
    value:base+bonus+charisme+atkPsi,
    base:base,
    bonus:bonus,
    valueLabel: game.i18n.localize("COC.ui.value")
  });
  sectionDEF.insertAdjacentHTML('afterend', mainDefPsi);
};

async function actor(wrapped, ...args) {
  if(this.type !== 'foundry-menacex.menacexbase') await wrapped(...args);
}