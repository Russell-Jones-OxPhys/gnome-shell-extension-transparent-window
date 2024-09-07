import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as Utils from './utils.js';
const getMultiKeysCode = Utils.getMultiKeysCode;

let setting;
let ModifierKeyWidget;
let startTime = 0;
let maxKeysCode = 0;
let keymap, sig_keymap;

// TODO: this has to be obtained and set by a subclass of ExtensionPreferences
const TransparentWindowPrefsWidget = new GObject.Class({
  Name: 'TransparentWindow.Prefs.Widget',
  GTypeName: 'TransparentWindowPrefsWidget',
  Extends: Gtk.Box,

  _init: function(params) {
    this.parent(params);
    this.set_orientation(Gtk.Orientation.VERTICAL);

    //Modifier key code setting
    let ModifierKeyBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      'margin-start' : 10
    });
    let ModifierKeyLabel = new Gtk.Label({label:_("Modifier Key Code:"), xalign:0});

    ModifierKeyLabel.set_wrap(true); //For GTK4

    ModifierKeyLabel.set_markup("Modifier Key Code:\n<small>Press the key(combination of Ctrl, Alt, Shift and Super key only) you want to use with scroll to change window transparency. Default key code(Alt) is 8.</small>");
    ModifierKeyWidget = new Gtk.SpinButton();
    ModifierKeyWidget.set_sensitive(true);
    ModifierKeyWidget.set_range(0,65535);
    ModifierKeyWidget.set_value(setting.get_int('modifier-key'));
    ModifierKeyWidget.set_increments(1,2);
    ModifierKeyWidget.connect('value-changed', function(w) {
      setting.set_int('modifier-key', w.get_value_as_int());
    });

      ModifierKeyBox.prepend(ModifierKeyLabel, true, true, 0);
      ModifierKeyBox.append(ModifierKeyWidget);
      this.append(ModifierKeyBox);

    //Log verbose level setting
    let LogLevelBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      'margin-start': 10
    });
    let LogLevelLabel = new Gtk.Label({label:_("Log Verbose Level:"), xalign:0});
    let LogLevelWidget = new Gtk.ComboBoxText();
    let levels = {0:_("Debug"), 1:_("Info"), 2:_("Warn"), 3:_("Error")};
    for (id in levels) {
      LogLevelWidget.append(id, levels[id]);
    }
    LogLevelWidget.set_active(setting.get_int('verbose-level'));
    LogLevelWidget.connect('changed', function(comboWidget) {
      setting.set_int('verbose-level', comboWidget.get_active());
    });

      LogLevelBox.prepend(LogLevelLabel, true, true, 0);
      LogLevelBox.append(LogLevelWidget);
      this.append(LogLevelBox);
  },
});

// TODO: this has to be a class extending ExtensionPreferences
export default class TransparentWindowPreferences extends ExtensionPreferences {
  constructor(metadata){
    super(metadata);
    setting = this.getSettings();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
      const display = Gdk.Display.get_default();

      if (display !== null) {
        keymap = Gdk.Keymap.get_for_display(display);
        sig_keymap = keymap.connect('state_changed', onHotkeyPressed);

        return GLib.SOURCE_REMOVE; // destroy task
      }

      return true; // repeat task
    });
  }

  fillPreferencesWindow(window) {

  }

  onHotkeyPressed() {
    const multiKeysCode = getMultiKeysCode(keymap);
    //new keystroke series coming out, reset startTime and max keyscode
    if(Date.now() - startTime > 500) {
      startTime = Date.now();
      maxKeysCode = 0;
    }
    maxKeysCode = Math.max(maxKeysCode, multiKeysCode);
    ModifierKeyWidget.set_value(maxKeysCode);
    return;
  }

  buildPrefsWidget(){
    let widget = new TransparentWindowPrefsWidget();

    return widget;
  }
}
