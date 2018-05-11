// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
