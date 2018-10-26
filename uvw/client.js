
require('./plugin');

window.initS4A = function () {
  let world = new WorldMorph(document.getElementById('world'));
  // keepAlive should be handled at the plugin side
  world.Arduino.keepAlive = false;

  let ide = new IDE_Morph();
  ide.openIn(world);
  ide.inform = function(title, message, callback) { 
      var myself = this;
      if (!myself.informing) {
          var box = new DialogBoxMorph();
          myself.informing = true;
          box.ok = function() { 
              myself.informing = false;
              if (callback) { callback() };
              this.accept();
          };
          box.inform(title, message, world)
      }
  };

  window.world = world;
  window.ide = ide;

  setInterval(function() { world.doOneCycle(); }, 1);
};
