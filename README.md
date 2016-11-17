# Plugged In

[![Build Status](https://travis-ci.org/rawphp/plugged-in.svg?branch=master)](https://travis-ci.org/rawphp/plugged-in)
[![Code Climate](https://codeclimate.com/github/rawphp/plugged-in/badges/gpa.svg)](https://codeclimate.com/github/rawphp/plugged-in)
[![Test Coverage](https://codeclimate.com/github/rawphp/plugged-in/badges/coverage.svg)](https://codeclimate.com/github/rawphp/plugged-in/coverage)
[![Issue Count](https://codeclimate.com/github/rawphp/plugged-in/badges/issue_count.svg)](https://codeclimate.com/github/rawphp/plugged-in)

Plugin system for Node Js.

## NOTE: This module is under heavy development and breaking changes are possible.

## Installation

      npm install plugged-in

## Usage

Let's imagine that you want to create an application where it can be extended via plugin modules. To accomplish this you need to have your application class extend
the PluginManager class.

#### Application.js

      export default class Application extends PluginManager {
        constructor(config) {
          super(config);
        }
      }

Also, add the `plugged-in` configuration to your package.json and set your application `context`.

#### package.json

      "plugged-in": {
        "context": "plugged-in-test"
      },

That's it. You're now ready to have your plugin modules get plugged-in.


Now, for your plugins. Your plugin modules need to export and advertise their supported functionality.

#### package.json

      "plugged-in": {
        "context": "plugged-in-test",
        "provides": {
          "getTitle": "getTitle",
          "getBody": [
            "getBody",
            "removeLinks"
          ]
        }
      },

In this example, the plugin tells the PluginManager that it provides the `getTitle` and `getBody` features in the `plugged-in-test` context.

Only plugins that match the PluginManager context will be plugged in.

For `getTitle` it provides one event callback, the `getTitle(event)` callback and for get body, it provides two, `getBody(event)` and `removeLinks(event)`.

These callbacks will be called in the order they are defined.

### Invoke Plugin Functionality

To invoke the plugin's functions, you need to dispatch an event from the PluginManager (or your Application).

      const obj = { body: 'current body' };

      this.dispatch('getBody', obj);

      const body = obj.body; // resulting value

You can optionally emit an event instead if required:

      import { Event } from 'plugged-in'; // added at the top of the file

      const event = new Event({ name: 'getBody', data: this });

      this.emit('getBody', event)

      const body = event.data.body; // resulting value

When execution returns after calling `dispatch`, the event's `data` property should be modified if a return value is expected.


## More on Usage

See the examples directory for usage example. The examples show the manager project and one plugin project.

### NOTE:

If you have plugins installed globally, you need to run the link command to make them
available to the plugin manager.

      npm link plugged-in-plugin

### Add additional Plugins on init

When initialising the PluginManager, you can optionally pass your own handlers to the manager. If it matches an existing function name
already registered it will replace it. This allows you to locally override plugin functionality. On the other hand, if you want to allow
duplicated function names, pass `override = false` to the constructor in the options.

      const addInitialisedAt = (event) => {
        event.data.initialisedAt = new Date();
      };

      const result = await manager.init({
        postInit: addInitialisedAt,
      });


## API

Listed is the public api of the PluginManager.

#### init
Async method to initialise the application by loading the available plugins.

      await manager.init(plugin = {});

#### dispatch
Async method to dispatche events to activate plugin functionality.

      await manager.dispatch(eventName, obj);

#### hasHandlers
Determines if the application has handlers for a specific event.

      manager.hasHandlers(event);

#### hasHandler
Determines if the application has a specific handler for an event.

      manager.hasHandler(event, handler);

#### removeHandler
Removes a specific handler from an event.

      manager.removeHandler(event, handler);

#### addPlugins(plugins);
Async method to add additional plugins. Takes a list of plugins that match the plugin schema.

      await manager.addPlugins(plugins);
