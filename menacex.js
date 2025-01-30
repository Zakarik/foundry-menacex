const MODULE_ID = 'foundry-menacex'; // Change this ID!

Hooks.once('ready', () => { 
  console.warn(CONFIG);
  libWrapper.register(MODULE_ID, "CONFIG.Actor.sheetClasses.character['coc.CoCActorSheet'].cls.prototype._render", characterSheet2_render, "WRAPPER");
});

async function characterSheet2_render(wrapped, ...args) {
  await wrapped(...args);
  if (!this.actor.isOwner) return;
  const sectionPT = this.element[0]?.querySelector(`div.tab.stats > div.flexrow:last-of-type div.flex1:last-of-type`);
  const sectionDEF = this.element[0]?.querySelector(`div.tab.stats > div.flexrow div.flexrow.defence`).parentElement;

  if(!sectionPT) return;
  // POINTS DE TENSIONS
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
  sectionDEF.innerHTML += mainDefPsi;


};