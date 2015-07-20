var Stats = require('docker-stats');
var AllContainers = require('docker-allcontainers');
var through = require('through2');
var StatsClient = require('stats-client');
var os = require('os');
var meminfo = require('meminfo');

var host = process.env.COREOS_PRIVATE_IPV4 || 'localhost';
var client = new StatsClient(host + ':8125' || 'localhost:8125', {containerHost: host});

function startCollection() {
  var statOpts = {
    preheat: true
  };

  Stats(statOpts).pipe(through.obj(function(chunk, enc, cb) {
    var maxMemoryUsage = chunk.stats.memory_stats.max_usage;
    var memoryUsage = chunk.stats.memory_stats.usage;
    var containerId = chunk.name;
    var image = chunk.image;
    client.gauge('container.memory', memoryUsage, {container: containerId, image: image});
    client.gauge('container.memory.max', maxMemoryUsage, {container: containerId, image: image});
    this.push('Usage: '+ memoryUsage +' Max Usage: ' + maxMemoryUsage + ' for container: ' + containerId + ' image:' + image);
    this.push('\n');
    cb();
  })).pipe(process.stdout); 
}

function startMeminfoCollection() {
  var delay = 30000;
  var collect = function() {
    meminfo(function(err, data) {
      setTimeout(collect, delay);
      if (err) {
        console.error('Failed to collect stats from /proc/meminfo ' + err);
        return;
      }
      
      client.gauge('instance.freememory', data.MemFree);
      console.log('Instance Free Memory:', data.MemFree + ' kb');
    });
  };
  
  collect();
}

startCollection();
if (os.platform() === 'linux') {
  console.log('Linux Platform detected starting meminfo collection');
  startMeminfoCollection();
}
