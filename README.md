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

See the examples directory for usage example. The examples show the manager project and one plugin project.

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

