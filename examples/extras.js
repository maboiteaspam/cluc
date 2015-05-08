module.exports = {
  precise64:{
    apache:{
      checkInstall: function(){},
      reload: function(){
        return this.stream('/usr/sbin/apache2 -t', function(){
          this.mustnot(/command not found/, "httpd not installed");
          this.display();
        }).stream('service httpd reload', function(){
          this.mustnot(/: unrecognized service/, "httpd not installed");
          this.display();
        });
      },
      uninstall: function(){
        return this.stream('sudo apt-get remove apache2 -y', function(){
          this.progress(/Reading (:<title>[\w\s]+)[ .]*(:<current>\d+)%/);
          this.mustnot(/0 to remove/, 'no package to remove found');
          this.confirm(/([1-9]+) to remove/, ' found %s package to remove');
          this.success(/(Removing [^ ]+\s+[.]+)/i, 'Package removed !');
          this.warn(/(Unable to locate package )/i, 'Package not found');
        }).stream('sudo apt-get clean', function(){
          this.display();
        });
      },
      install: function(){
        return this.stream('sudo apt-get install apache2 -y', function(){
          this.mustnot(/You should explicitly select one to install/, "too many results");
          this.mustnot(/has no installation candidate/, "can not install httpd");
          this.watch(/Need to get ([0-9- ,-]+ [a-z]+) of archives/i, "downloading %s");
          this.watch(/([0-9- ,.]+\s+[a-z]+) of additional disk space will be used/i, "consumed %s");
          this.spin(/[.]+\s+([0-9]+)%/);
          this.warn(/(is already the newest version)/i, 'Already installed');
          this.warn(/(0 newly installed)/i, 'Package not installed');
          this.confirm(/([^ /]+)\.deb/i, "version is %s");
          this.success(/(Setting up)/i, 'Package installed !');
          this.display();
        });
      },
      status: function(){}
    }
  }
};