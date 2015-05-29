var Stats = require('docker-stats');
var AllContainers = require('docker-allcontainers');
var through = require('through2');
var StatsClient = require('stats-client');
var host = process.env.COREOS_PRIVATE_IPV4 || 'localhost';
var client = new StatsClient(host + ':8125' || 'localhost:8125', {containerHost: host});

function startCollection() {
  var statOpts = {
    preheat: true
  };

  Stats(statOpts).pipe(through.obj(function(chunk, enc, cb) {
    var maxMemoryUsage = chunk.stats.memory_stats.max_usage;
    var memoryUsage = chunk.stats.memory_stats.usage;
    var containerId = chunk.id;
    var image = chunk.image;
    client.gauge('container.memory', memoryUsage, {container: containerId, image: image});
    client.gauge('container.memory.max', maxMemoryUsage, {container: containerId, image: image});
    this.push('Usage: '+ memoryUsage +' Max Usage: ' + maxMemoryUsage + ' for container: ' + containerId + ' image: ' + image);
    this.push('\n');
    cb();
  })).pipe(process.stdout); 
}

startCollection();
