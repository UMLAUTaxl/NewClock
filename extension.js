/*
 * Copyright 2011 Aleksander Zdyb
 * Copyright 2012 Arnaud Bonatti
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
const Main = imports.ui.main;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const St = imports.gi.St;
const Gio = imports.gi.Gio;


const ERROR_LABEL = "---";
const UPDATE_INTERVAL = 500;
const LINE_WIDTH = 2;
const MARGIN = 1;


// in org.gnome.desktop.interface
const CLOCK_FORMAT_KEY        = 'clock-format';
// in org.gnome.shell.clock
const CLOCK_SHOW_SECONDS_KEY  = 'show-seconds';


function NewClock() {
    this._init();
}

NewClock.prototype = {
    _init: function() {
	this.date = Main.panel._dateMenu._date;
	// this.settings = Main.panel._dateMenu.menu.box.get_children()[0].get_children()[0].get_children()[3];
            
        this.display_time = [-1, -1];
        this.time_format = "%R"; // Safe fallback
        
        this.date_menu = Main.panel._dateMenu;
        this.orig_clock = this.date_menu._clock;
        this.new_clock = new St.Label({text: ERROR_LABEL});
        
        this.desktop_settings = new Gio.Settings({ schema: "org.gnome.desktop.interface" });
        this.clock_settings = new Gio.Settings({ schema: "org.gnome.shell.clock" });
        this.desktop_settings.connect("changed", Lang.bind(this, this.update_format));
        this.clock_settings.connect("changed", Lang.bind(this, this.update_format));
        this.update_format();
    },
    
    Run: function() {
        this.run = true;
        this.on_timeout();
        Mainloop.timeout_add(UPDATE_INTERVAL, Lang.bind(this, this.on_timeout));  
    },
    
    update_format: function() {
        let clock_format = this.desktop_settings.get_string(CLOCK_FORMAT_KEY);
        let show_seconds = this.clock_settings.get_boolean(CLOCK_SHOW_SECONDS_KEY);
        
        if (clock_format == "24h") this.time_format = "%-H h %-M";
        else this.time_format = "%a %e-%m, %l:%M";
        
        if (show_seconds) this.time_format += ":%S";
        
        if (clock_format == "24h") this.time_format += "    %A %e";
        else this.time_format += " %p";
    },
    
    on_timeout: function() {
        let now = new Date();
        this.new_clock.set_text(now.toLocaleFormat(this.time_format))
        let display_time = [now.getHours(), now.getMinutes()];
        
        if ((this.display_time[0] != display_time[0]) || (this.display_time[1] != display_time[1])) {
            this.display_time = display_time;
        }
        
        return true;
    },
    
    enable: function() {
        this.date_menu.actor.remove_actor(this.orig_clock);
        this.date_menu.actor.add_actor(this.new_clock);
        
        this.Run();
	this.date.hide();
    },
    
    disable: function() {
	this.date.show();
        this.run = false;
        
        this.date_menu.actor.remove_actor(this.new_clock);
        this.date_menu.actor.add_actor(this.orig_clock);
    }
}

function init() {
    return new NewClock();
}
