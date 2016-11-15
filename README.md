# Plugged In

Plugin system for Node Js.

## NOTE: This module is under heavy development.

## Installation

      npm install plugged-in

## Usage

If you have plugins installed globally, you need to run the link command to make them
available to the plugin manager.

      npm link plugged-in-plugin

### Add additional Plugins on init

      const addInitialisedAt = (event) => {
        event.data.initialisedAt = new Date();
      };

      const result = await manager.init({
        postInit: addInitialisedAt,
      });

