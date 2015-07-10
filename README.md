# grunt-sync-deploy

> Incremental deploy changed files to SSH.

## Getting Started
This plugin requires Grunt `~0.4.5`

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
    cwd: 'dist/',
    src: '**/*'
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
    username: '<%= deployInfo.username %>',
    password: '<%= deployInfo.password %>',
    deployTo: '<%= deployInfo.deployTo %>'
  }
}
```

`deployTo` is a folder on the SSH which you like to sync with the specified `src`.

To use this SSH configuration by default add `grunt.option('config', 'production');` to the end of your Gruntfile.

### Multiple targets
You may have more than one target if you have multiple places which you wanna deploy to.

```js
// don't keep SSH credentials in source control!
deployInfo: grunt.file.readJSON('deploy_info.json'),
sshconfig: {
  staging: {
    host: '<%= deployInfo.host %>',
    username: '<%= deployInfo.username %>',
    password: '<%= deployInfo.password %>',
    deployTo: '<%= deployInfo.deployTo %>'
  },
  production: {
    host: '<%= deployInfo.host %>',
    username: '<%= deployInfo.username %>',
    password: '<%= deployInfo.password %>',
    deployTo: '<%= deployInfo.deployTo %>'
  }
}
```

You can use the different targets by passing the option in your terminal: `grunt deploy --config=staging`.
