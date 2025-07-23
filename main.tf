
provider "google" {
  project = "shaped-orbit-466705-v7"
}

########################
# VARIABLES
########################

variable "region_zone_map" {
  description = "Map of regions to list of zones"
  default = {
    "asia-south1" = ["asia-south1-a", "asia-south1-b", "asia-south1-c"]
    "asia-south2" = ["asia-south2-a", "asia-south2-b", "asia-south2-c"]
  }
}

variable "instances_per_zone" {
  description = "Number of VMs to launch per zone"
  type        = number
  default     = 1
}

variable "suffix" {
  description = "Optional custom suffix for resource naming"
  type        = string
  default     = null
}

########################
# LOCALS
########################

locals {
  region_zone_pairs = flatten([
    for region, zones in var.region_zone_map : [
      for zone in zones : {
        region = region
        zone   = zone
      }
    ]
  ])

  batch_suffix    = var.suffix != null ? var.suffix : formatdate("YYYYMMDD-HHmmss", timestamp())
  total_instances = length(local.region_zone_pairs) * var.instances_per_zone
}

########################
# RESOURCES
########################

resource "google_compute_address" "static_ip" {
  count  = local.total_instances
  name   = "squid-ip-${local.batch_suffix}-${count.index}"
  region = local.region_zone_pairs[floor(count.index / var.instances_per_zone)].region
}

resource "google_compute_instance" "squid_proxy" {
  count        = local.total_instances
  name         = "squid-vm-${local.batch_suffix}-${count.index}"
  machine_type = "e2-small"
  zone         = local.region_zone_pairs[floor(count.index / var.instances_per_zone)].zone

  tags = ["squid-proxy"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.static_ip[count.index].address
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt update -y
    apt install -y squid
    sed -i '/http_access deny all/d' /etc/squid/squid.conf
    echo "http_access allow all" >> /etc/squid/squid.conf
    sed -i '/^#http_port 3128/s/^#//' /etc/squid/squid.conf
    grep -q "http_port 3128" /etc/squid/squid.conf || echo "http_port 3128" >> /etc/squid/squid.conf
    systemctl restart squid
    systemctl enable squid
  EOF
}

########################
# OUTPUTS
########################

output "external_ips" {
  description = "List of external static IPs assigned"
  value       = [for ip in google_compute_address.static_ip : ip.address]
}

output "instance_names" {
  description = "List of created VM names"
  value       = [for vm in google_compute_instance.squid_proxy : vm.name]
}
