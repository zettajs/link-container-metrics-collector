#Docker Container Metrics Collector

Basic container metrics. Right now collects memory used and max memory used by all containers on machine. Reports them to statsd accordingly. To run the container use this command.

`docker run -v /var/run/docker.sock:/var/run/docker.sock -e COREOS_PRIVATE_IPV4=<PRIVATE IPV4> zetta/link-container-metrics-collector`

The docker unix socket must be mounted into the container, and the box IP must be provided as well.


## Disclaimer

This is not an officially supported Google product.