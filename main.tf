provider "google" {
  project = "booking-p2"
}

variable "region_zone_map" {
  default = {
    "asia-south1" = ["asia-south1-a", "asia-south1-b", "asia-south1-c"],
    "asia-south2" = ["asia-south2-a", "asia-south2-b", "asia-south2-c"]
  }
}

variable "instances_distribution" {
  default = {
    "asia-south1-a" = 2
    "asia-south1-b" = 2
    "asia-south2-a" = 2
    "asia-south2-b" = 2
  }
}


variable "suffix" {
  type    = string
  default = null
}

locals {
  batch_suffix = var.suffix != null ? var.suffix : formatdate("YYYYMMDD-HHmmss", timestamp())

  instance_configs = flatten([
    for zone, count in var.instances_distribution : [
      for i in range(count) : {
        zone   = zone
        region = format("%s-%s", split("-", zone)[0], split("-", zone)[1])
        index  = "${zone}-${i}"
      }
    ]
  ])
}

resource "google_compute_address" "static_ip" {
  count  = length(local.instance_configs)
  name   = "p2-ip-${local.batch_suffix}-${count.index}"
  region = local.instance_configs[count.index].region
}

resource "google_compute_instance" "squid_proxy" {
  count        = length(local.instance_configs)
  name         = "p2-vm2-${local.batch_suffix}-${count.index}"
  machine_type = "e2-small"
  zone         = local.instance_configs[count.index].zone

  tags = ["squid-proxy"]
metadata_startup_script = <<-EOF
#!/bin/bash
sudo dnf install -y squid
cat <<EOC | sudo tee /etc/squid/squid.conf
http_port 0.0.0.0:3128
acl smtp port 25
http_access deny smtp
http_access allow all
forwarded_for delete
EOC
sudo systemctl enable --now squid
EOF

  boot_disk {
    initialize_params {
      image = "centos-cloud/centos-stream-9"
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.static_ip[count.index].address
    }
  }
}

output "external_ips" {
  value = [for ip in google_compute_address.static_ip : ip.address]
}

output "instance_names" {
  value = [for vm in google_compute_instance.squid_proxy : vm.name]
}
