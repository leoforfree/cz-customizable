'use strict';

var path = require('path');
var fs = require('fs');

var SYM_LINK_LOCATION = './cz-config';
var CZ_CONFIG_NAME = '.cz-config';
var CZ_CONFIG_EXAMPLE_LOCATION = './cz-config-EXAMPLE.js';



fs.stat(path.resolve('./../../' + CZ_CONFIG_NAME), function(err, stats) {
  if (err) {
    console.info('>>> config file doesn\'t exist. I will create one for you.');
    fs.writeFileSync(path.resolve('./../../' + CZ_CONFIG_NAME), fs.readFileSync(path.resolve(CZ_CONFIG_EXAMPLE_LOCATION)));
  } else {
    console.info('>>> file ' + CZ_CONFIG_NAME + ' already exist in your project root. We will NOT override it.');
  }

});

//first delete any existing symbolic link.
fs.unlink(SYM_LINK_LOCATION, function(err) {

  // create or re-create symlink to file located 2 dirs up.
  console.info('>>> cz-customizable is about to create this symlink "' + __dirname + '/.cz-config" to point to your project root directory, 2 levels up.');
  fs.symlinkSync(path.resolve('./../../' + CZ_CONFIG_NAME), path.resolve(SYM_LINK_LOCATION), 'file');
});
