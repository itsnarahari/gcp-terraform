provider "google" {
  project = "ramesh-1-472107"
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

variable "allowed_cidrs" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "port" {
  type    = number
  default = 3128
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
  name   = "c${count.index}"
  region = local.instance_configs[count.index].region
  network_tier = "STANDARD"
}

resource "google_compute_firewall" "allow_tcp_udp_for_apimaker" {
  name    = "allow-tcp-udp"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = var.allowed_cidrs
  target_tags   = ["apimaker"]
}

resource "google_compute_instance" "apimaker" {
  count        = length(local.instance_configs)
  name         = "c${count.index}"
  machine_type = "e2-small"
  zone         = local.instance_configs[count.index].zone
  tags         = ["apimaker"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
    }
  }

  network_interface {
    network = "default"
    access_config {
    network_tier = "STANDARD"
      nat_ip = google_compute_address.static_ip[count.index].address
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    sudo apt-get update
    sudo apt-get install -y squid
    sudo bash -c 'cat > /etc/squid/squid.conf' <<EOCONF
    http_port 0.0.0.0:${var.port}
    acl smtp port 25
    http_access deny smtp
    http_access allow all
    forwarded_for delete
    EOCONF
    sudo systemctl enable squid
    sudo systemctl restart squid
  EOF
}

output "external_ips" {
  value = [for ip in google_compute_address.static_ip : ip.address]
}

output "instance_names" {
  value = [for vm in google_compute_instance.apimaker : vm.name]
}
