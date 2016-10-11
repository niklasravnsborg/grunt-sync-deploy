# grunt-sync-deploy

> Automatically synchronize changed local files with your server.

This Grunt plugin is a simple deployment system which can run on your local environment. Every time you deploy, the plugin  compares the file dates on your server with your local ones. This way it will upload only the new and changed files. This is valuable on managed servers that don't support complex autonomous deployments or version control.

## What you need

* SSH access to your server
* [Grunt: The JavaScript Task Runner](http://gruntjs.com)
* This plugin

## Getting Started
This plugin requires Grunt `>=0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-sync-deploy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-sync-deploy');
```

## The "syncdeploy" task

### Overview
In your project's Gruntfile, add a section named `syncdeploy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  syncdeploy: {
    main: {
      cwd: 'dist/',
      src: ['**/*']
    }
  }
});
```

You'll also have to add a `sshconfig` to pass the SSH configuration for your Server. **Never keep your SSH credentials in source control!**

```js
// don't keep SSH credentials in source control!
deployInfo: grunt.file.readJSON('deploy_info.json'),
sshconfig: {
  production: {
    host: '<%= deployInfo.host %>',
    port: '<%= deployInfo.port %>', // optional
    username: '<%= deployInfo.username %>',
    password: '<%= deployInfo.password %>',
    deployTo: '<%= deployInfo.deployTo %>'
  }
}
```

`deployTo` is a folder on the SSH which you like to sync with the specified `src`.

To use this SSH configuration by default add `grunt.option('config', 'production');` to the end of your Gruntfile.

### Options

#### removeEmpty
Type: `Boolean`  
Default: `false`

Remove empty directories inside the `deployTo` path on the SSH after deploying.

#### keepFiles
Type: `Array`  
Default: `[]`

Files to keep no matter whether there are newer local files. This can be useful for config files. Use an array with the paths to the files you want to keep. This has to be relative to the `deployTo` path. You can also use [minimatch](https://github.com/isaacs/minimatch) syntax here.

#### serverTimezone
Type: `String`  
Default: `''`

If the timezone of your server doesn't match up with your local one the syncing may not happen correctly. In this case you can declare the timezone of your server. For example: `serverTimezone: 'GMT+0000'`.

### Multiple targets
You may have more than one target (e.g. staging, production) if you have multiple places which you want to deploy to.

```js
// don't keep SSH credentials in source control!
deployInfo: grunt.file.readJSON('deploy_info.json'),
sshconfig: {
  staging: {
    host: '<%= deployInfo.host %>',
    port: '<%= deployInfo.port %>', // optional
    username: '<%= deployInfo.username %>',
    password: '<%= deployInfo.password %>',
    deployTo: '<%= deployInfo.deployTo %>'
  },
  production: {
    host: '<%= deployInfo.host %>',
    port: '<%= deployInfo.port %>', // optional
    username: '<%= deployInfo.username %>',
    password: '<%= deployInfo.password %>',
    deployTo: '<%= deployInfo.deployTo %>'
  }
}
```

You can use the different targets by passing the option in your terminal: `grunt deploy --config=staging`.
